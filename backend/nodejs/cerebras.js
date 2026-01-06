/**
 * Cerebras AI Client
 * Wrapper for Cerebras Cloud SDK using Qwen 3 235B model
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

// Model configuration
const MODEL = 'qwen-3-235b-a22b-instruct-2507';

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
        const cerebrasClient = getClient();
        if (!cerebrasClient) {
            throw new Error('Cerebras API key not configured');
        }
        const completion = await cerebrasClient.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            model: MODEL,
            temperature: 0.1, // Low temperature for more deterministic SQL
            max_completion_tokens: 1024,
        });

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
        console.error('Cerebras translation error:', error);
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
        const cerebrasClient = getClient();
        if (!cerebrasClient) {
            throw new Error('Cerebras API key not configured');
        }
        const completion = await cerebrasClient.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: MODEL,
            temperature: 0.3,
            max_completion_tokens: 1024,
        });

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
        const cerebrasClient = getClient();
        if (!cerebrasClient) {
            throw new Error('Cerebras API key not configured');
        }
        const completion = await cerebrasClient.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: MODEL,
            temperature: 0.3,
            max_completion_tokens: 1024,
        });

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
        const cerebrasClient = getClient();
        if (!cerebrasClient) {
            throw new Error('Cerebras API key not configured');
        }
        const completion = await cerebrasClient.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            model: MODEL,
            temperature: 0.1,
            max_completion_tokens: 1024,
        });

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
 * Check if Cerebras client is configured
 * @returns {boolean}
 */
function isAvailable() {
    return !!process.env.CEREBRAS_API_KEY;
}

module.exports = {
    translateToSQL,
    explainSQL,
    optimizeSQL,
    validateSQL,
    debugSQL,
    isAvailable,
    MODEL,
};
