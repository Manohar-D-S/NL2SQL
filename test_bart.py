"""
Test script to verify BART model integration
Run this to test the NL2SQL translation without starting the full server
"""

import asyncio
from app.services.bart_translator import bart_translator

# Sample schema context (like what would come from the database)
SAMPLE_SCHEMA = """
CREATE TABLE students (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    marks INT,
    department VARCHAR(50),
    year INT,
    gpa FLOAT
);

CREATE TABLE courses (
    id INT PRIMARY KEY,
    course_name VARCHAR(100),
    credits INT,
    department VARCHAR(50)
);

CREATE TABLE enrollments (
    student_id INT,
    course_id INT,
    grade VARCHAR(2),
    semester VARCHAR(20),
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
);
"""

# Test queries
TEST_QUERIES = [
    "Show all students with marks above 80",
    "Get names of students in Computer Science department",
    "Find students with GPA greater than 3.5",
    "List all courses with more than 3 credits",
    "Show students enrolled in Fall 2024 semester",
]


async def test_translation():
    """Test BART translator with sample queries"""
    
    print("=" * 70)
    print("🧪 BART Model Translation Test")
    print("=" * 70)
    print()
    
    for i, query in enumerate(TEST_QUERIES, 1):
        print(f"\n📝 Test {i}/{len(TEST_QUERIES)}")
        print(f"Query: {query}")
        print("-" * 70)
        
        try:
            # Translate the query
            candidates = await bart_translator.translate(
                natural_language=query,
                schema_context=SAMPLE_SCHEMA,
                num_beams=3,
                num_return_sequences=3,
            )
            
            if candidates:
                print(f"✅ Generated {len(candidates)} SQL candidates:\n")
                for j, candidate in enumerate(candidates, 1):
                    print(f"  {j}. SQL: {candidate.sql}")
                    print(f"     Confidence: {candidate.confidence:.2%}")
                    print(f"     Reasoning: {candidate.reasoning}")
                    print()
            else:
                print("❌ No candidates generated")
                
        except Exception as e:
            print(f"❌ Error: {e}")
    
    print("=" * 70)
    print("✅ Test completed!")
    print("=" * 70)


if __name__ == "__main__":
    print("\n⏳ Loading BART model (this may take a minute on first run)...\n")
    asyncio.run(test_translation())
