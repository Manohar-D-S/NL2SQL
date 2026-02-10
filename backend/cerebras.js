/**
 * Cerebras AI Client
 * Wrapper for Cerebras Cloud SDK with robust error handling
 */

const Cerebras = require('@cerebras/cerebras_cloud_sdk').default;

// Lazily initialized Cerebras client
let client = null;

/**
 * Get or create Cerebras client (lazy initialization)
 * @returns {Cerebras|null}
 */
function getClient() {
    if (!client && process.env.CEREBRAS_API_KEY) {
        client = new Cerebras({
            apiKey: process.env.CEREBRAS_API_KEY,
        });
    }
    return client;
}

// Model priority list
// Tries to use the first available model. If 404, tries the next one.
const MODELS = [
    'qwen-3-235b-a22b-instruct-2507',
    'llama-3.3-70b',         // Primary working model
    'llama3.1-8b',           // Reliable fallback
    'qwen-3-32b',            // User requested
    'zai-glm-4.7',           // User requested
];

/**
 * sleep helper
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Execute completion with retry logic and model fallback
 * @param {Array} messages - Chat messages
 * @param {Object} options - Additional options (temperature, etc.)
 * @returns {Promise<object>} - Completion response
 */
async function createCompletion(messages, options = {}) {
    const cerebrasClient = getClient();
    if (!cerebrasClient) {
        throw new Error('Cerebras API key not configured');
    }

    let lastError = null;

    // Try each model in the list
    for (const model of MODELS) {
        console.log(`[Cerebras] Attempting with model: ${model}`);

        try {
            // Retry loop for rate limits (429)
            let retries = 3;
            let attempt = 0;

            while (attempt <= retries) {
                try {
                    const completion = await cerebrasClient.chat.completions.create({
                        messages,
                        model: model,
                        temperature: options.temperature || 0.1,
                        max_completion_tokens: options.max_completion_tokens || 1024,
                        stream: false,
                    });

                    console.log(`[Cerebras] Success with model: ${model}`);
                    return completion;

                } catch (error) {
                    // Check for rate limit
                    if (error.status === 429 || (error.error && error.error.code === 'rate_limit_exceeded')) {
                        attempt++;
                        if (attempt > retries) throw error; // Exhausted retries

                        // Exponential backoff: 1s, 2s, 4s
                        const delay = 1000 * Math.pow(2, attempt - 1);
                        console.warn(`[Cerebras] Rate limit (429) on ${model}. Retrying in ${delay}ms... (Attempt ${attempt}/${retries})`);
                        await sleep(delay);
                        continue;
                    }

                    throw error; // Other errors propagate to model loop
                }
            }
        } catch (error) {
            lastError = error;

            // If model not found (404), try next model
            if (error.status === 404 || (error.error && error.error.code === 'model_not_found')) {
                console.warn(`[Cerebras] Model ${model} not found or inaccessible. Trying next...`);
                continue;
            }

            // For other critical errors, stop trying models if it's likely not model-specific
            // But let's be safe and try next model unless it's auth error
            if (error.status === 401) {
                throw error; // Auth failed, no point trying others
            }

            console.warn(`[Cerebras] Error with ${model}: ${error.message}. Trying next...`);
        }
    }

    throw lastError || new Error('All models failed to respond.');
}

/**
 * Translate natural language to SQL using Cerebras AI
 * @param {string} naturalLanguage - The natural language query
 * @param {string} schemaContext - Database schema context (CREATE TABLE statements)
 * @returns {Promise<{sql: string, candidates: Array, success: boolean}>}
 */
async function translateToSQL(naturalLanguage, schemaContext = '') {
    const systemPrompt = `You are an expert SQL query writer. Your task is to convert natural language queries into valid SQL.

IMPORTANT RULES:
1. Generate only valid SQL for the given schema
2. Use table and column names exactly as shown in the schema
3. Return ONLY the SQL query, no explanation or markdown formatting
4. If the query is unclear, make reasonable assumptions
5. Always end SQL with a semicolon
6. For ambiguous queries, prefer SELECT statements`;

    const userPrompt = schemaContext
        ? `SCHEMA:\n${schemaContext}\n\nQUERY: ${naturalLanguage}\n\nSQL:`
        : `QUERY: ${naturalLanguage}\n\nSQL:`;

    try {
        const completion = await createCompletion(
            [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            { temperature: 0.1 }
        );

        let sql = completion.choices[0]?.message?.content?.trim() || '';

        // Clean up the response
        sql = sql.replace(/```sql\n?/gi, '').replace(/```\n?/g, '').trim();
        if (sql && !sql.endsWith(';')) {
            sql += ';';
        }

        return {
            sql,
            candidates: [{ id: '1', sql, confidence: 0.9 }],
            selectedIndex: 0,
            success: true,
        };
    } catch (error) {
        console.error('Translation error:', error);
        throw error;
    }
}

/**
 * Explain SQL query in natural language
 * @param {string} sql - The SQL query to explain
 * @returns {Promise<{explanation: string, clauses: object}>}
 */
async function explainSQL(sql) {
    const prompt = `Explain this SQL query in simple terms. Break down each clause (SELECT, FROM, WHERE, etc.) and explain what each part does.

SQL: ${sql}

Provide a clear, concise explanation that a beginner could understand.`;

    try {
        const completion = await createCompletion(
            [{ role: 'user', content: prompt }],
            { temperature: 0.3 }
        );

        const explanation = completion.choices[0]?.message?.content?.trim() || '';

        // Parse clauses (simplified)
        const clauses = {};
        const selectMatch = sql.match(/SELECT\s+(.+?)\s+FROM/i);
        const fromMatch = sql.match(/FROM\s+(\S+)/i);
        const whereMatch = sql.match(/WHERE\s+(.+?)(?:GROUP|ORDER|LIMIT|;|$)/i);
        const groupMatch = sql.match(/GROUP BY\s+(.+?)(?:ORDER|LIMIT|;|$)/i);
        const orderMatch = sql.match(/ORDER BY\s+(.+?)(?:LIMIT|;|$)/i);

        if (selectMatch) clauses.select = selectMatch[1].trim();
        if (fromMatch) clauses.from = fromMatch[1].trim();
        if (whereMatch) clauses.where = whereMatch[1].trim();
        if (groupMatch) clauses.groupBy = groupMatch[1].trim();
        if (orderMatch) clauses.orderBy = orderMatch[1].trim();

        return { explanation, clauses };
    } catch (error) {
        console.error('Cerebras explain error:', error);
        throw error;
    }
}

/**
 * Generate optimization suggestions for SQL query
 * @param {string} sql - The SQL query to optimize
 * @param {string} database - Target database
 * @returns {Promise<{suggestions: Array}>}
 */
async function optimizeSQL(sql, database) {
    const prompt = `Analyze this SQL query and provide optimization suggestions. Consider:
- Index recommendations
- Query rewrites for better performance
- Best practices

SQL: ${sql}
Database: ${database}

Provide 2-3 specific, actionable suggestions with estimated performance improvements.`;

    try {
        const completion = await createCompletion(
            [{ role: 'user', content: prompt }],
            { temperature: 0.3 }
        );

        const response = completion.choices[0]?.message?.content?.trim() || '';

        // Parse suggestions (simplified - return as structured suggestions)
        const suggestions = [
            {
                type: 'other',
                suggestion: response,
                speedup: 'varies',
            },
        ];

        // Try to extract more structured suggestions
        const indexMatch = response.match(/index|INDEX/i);
        if (indexMatch) {
            suggestions.unshift({
                type: 'index',
                suggestion: 'Consider adding indexes on frequently queried columns.',
                speedup: '2-10x',
            });
        }

        return { suggestions };
    } catch (error) {
        console.error('Cerebras optimize error:', error);
        throw error;
    }
}

/**
 * Validate SQL for safety concerns
 * @param {string} sql - The SQL query to validate
 * @returns {Promise<{isSafe: boolean, warnings: Array, isSuspicious: boolean}>}
 */
async function validateSQL(sql) {
    const upperSQL = sql.toUpperCase();
    const warnings = [];
    let isSuspicious = false;

    // Check for dangerous operations
    const dangerousPatterns = [
        { pattern: /DROP\s+(TABLE|DATABASE|INDEX)/i, message: 'Contains DROP statement - may delete data permanently' },
        { pattern: /DELETE\s+FROM\s+\w+\s*(?:;|$)/i, message: 'DELETE without WHERE clause - may delete all records' },
        { pattern: /TRUNCATE/i, message: 'Contains TRUNCATE - will remove all data from table' },
        { pattern: /UPDATE\s+\w+\s+SET.*(?:;|$)/i, message: 'UPDATE statement detected - verify WHERE clause' },
        { pattern: /ALTER\s+TABLE/i, message: 'Contains ALTER TABLE - may modify table structure' },
        { pattern: /GRANT|REVOKE/i, message: 'Contains permission changes' },
    ];

    for (const { pattern, message } of dangerousPatterns) {
        if (pattern.test(sql)) {
            warnings.push(message);
            isSuspicious = true;
        }
    }

    // Check for SQL injection patterns
    const injectionPatterns = [
        /;\s*(DROP|DELETE|UPDATE|INSERT)/i,
        /UNION\s+SELECT/i,
        /'.*OR.*'.*=/i,
        /--\s*$/m,
    ];

    for (const pattern of injectionPatterns) {
        if (pattern.test(sql)) {
            warnings.push('Potential SQL injection pattern detected');
            isSuspicious = true;
            break;
        }
    }

    return {
        isSafe: warnings.length === 0,
        warnings,
        isSuspicious,
    };
}

/**
 * Debug and fix a failed SQL query
 * @param {string} sql - The SQL query that failed
 * @param {string} errorMessage - The error message from MySQL
 * @param {string} schemaContext - Database schema context
 * @returns {Promise<{fixedSql: string, explanation: string, success: boolean}>}
 */
async function debugSQL(sql, errorMessage, schemaContext = '') {
    const systemPrompt = `You are an expert SQL debugger. Your task is to fix SQL queries that have errors.

IMPORTANT RULES:
1. Analyze the error message carefully
2. Use the schema to identify correct table and column names
3. Return ONLY the corrected SQL query, no explanation or markdown formatting
4. Always end SQL with a semicolon
5. If you cannot fix the query, return the original query`;

    const userPrompt = `SCHEMA:
${schemaContext}

FAILED SQL QUERY:
${sql}

ERROR MESSAGE:
${errorMessage}

Please fix the SQL query based on the error and schema. Return ONLY the corrected SQL:`;

    try {
        const completion = await createCompletion(
            [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            { temperature: 0.1 }
        );

        let fixedSql = completion.choices[0]?.message?.content?.trim() || '';

        // Clean up the response
        fixedSql = fixedSql.replace(/```sql\n?/gi, '').replace(/```\n?/g, '').trim();
        if (fixedSql && !fixedSql.endsWith(';')) {
            fixedSql += ';';
        }

        return {
            fixedSql,
            originalSql: sql,
            originalError: errorMessage,
            success: true,
        };
    } catch (error) {
        console.error('Cerebras debug error:', error);
        throw error;
    }
}

/**
 * Translate natural language to MongoDB query using Cerebras AI
 * @param {string} naturalLanguage - The natural language query
 * @param {string} schemaContext - Database schema context (collection structures)
 * @returns {Promise<{query: object, candidates: Array, success: boolean}>}
 */
async function translateToMongoDB(naturalLanguage, schemaContext = '') {
    const systemPrompt = `You are an expert MongoDB query writer. Your task is to convert natural language queries into valid MongoDB operations.

IMPORTANT RULES:
1. Return ONLY a valid JSON object with the following structure:
   {
     "collection": "collectionName",
     "operation": "find|findOne|aggregate|count|distinct",
     "query": { ... },
     "options": { ... }
   }
2. Use collection and field names exactly as shown in the schema
3. For aggregation pipelines, put the pipeline array in the "query" field
4. Do NOT include any explanation or markdown, ONLY the JSON object
5. Common operations:
   - find: query is the filter object
   - aggregate: query is the pipeline array
   - count: query is the filter object
   - distinct: query is the filter, options.field is the field name`;

    const userPrompt = schemaContext
        ? `SCHEMA:\n${schemaContext}\n\nQUERY: ${naturalLanguage}\n\nMONGODB JSON:`
        : `QUERY: ${naturalLanguage}\n\nMONGODB JSON:`;

    try {
        const completion = await createCompletion(
            [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            { temperature: 0.1 }
        );

        let response = completion.choices[0]?.message?.content?.trim() || '';

        // Clean up the response
        response = response.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();

        // Parse the JSON
        let queryObj;
        try {
            queryObj = JSON.parse(response);
        } catch (e) {
            console.error('Failed to parse MongoDB query JSON:', response);
            throw new Error('Invalid MongoDB query format returned');
        }

        // Format for display
        const displayQuery = `db.${queryObj.collection}.${queryObj.operation}(${JSON.stringify(queryObj.query, null, 2)})`;

        return {
            query: queryObj,
            sql: displayQuery, // For compatibility with frontend
            candidates: [{ id: '1', sql: displayQuery, query: queryObj, confidence: 0.9 }],
            selectedIndex: 0,
            success: true,
        };
    } catch (error) {
        console.error('Cerebras MongoDB translation error:', error);
        throw error;
    }
}

/**
 * Debug and fix a failed MongoDB query
 * @param {string} queryStr - The MongoDB query that failed (as string)
 * @param {string} errorMessage - The error message from MongoDB
 * @param {string} schemaContext - Database schema context
 * @returns {Promise<{fixedQuery: object, success: boolean}>}
 */
async function debugMongoDB(queryStr, errorMessage, schemaContext = '') {
    const systemPrompt = `You are an expert MongoDB debugger. Your task is to fix MongoDB queries that have errors.

IMPORTANT RULES:
1. Analyze the error message carefully
2. Use the schema to identify correct collection and field names
3. Return ONLY a valid JSON object with the following structure:
   {
     "collection": "collectionName",
     "operation": "find|findOne|aggregate|count|distinct",
     "query": { ... },
     "options": { ... }
   }
4. Do NOT include any explanation or markdown, ONLY the JSON object`;

    const userPrompt = `SCHEMA:
${schemaContext}

FAILED MONGODB QUERY:
${queryStr}

ERROR MESSAGE:
${errorMessage}

Please fix the MongoDB query based on the error and schema. Return ONLY the corrected JSON:`;

    try {
        const completion = await createCompletion(
            [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            { temperature: 0.1 }
        );

        let response = completion.choices[0]?.message?.content?.trim() || '';

        // Clean up the response
        response = response.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();

        // Parse the JSON
        let queryObj;
        try {
            queryObj = JSON.parse(response);
        } catch (e) {
            console.error('Failed to parse fixed MongoDB query JSON:', response);
            throw new Error('Invalid MongoDB query format returned');
        }

        const displayQuery = `db.${queryObj.collection}.${queryObj.operation}(${JSON.stringify(queryObj.query, null, 2)})`;

        return {
            fixedQuery: queryObj,
            fixedSql: displayQuery, // For compatibility
            originalError: errorMessage,
            success: true,
        };
    } catch (error) {
        console.error('Cerebras MongoDB debug error:', error);
        throw error;
    }
}

/**
 * Check if Cerebras client is configured
 * @returns {boolean}
 */
function isAvailable() {
    return !!process.env.CEREBRAS_API_KEY;
}

module.exports = {
    translateToSQL,
    translateToMongoDB,
    explainSQL,
    optimizeSQL,
    validateSQL,
    debugSQL,
    debugMongoDB,
    isAvailable,
    // Export models list for testing/info
    MODELS,
};
