from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

query_question_with_context = """sql_prompt: Which economic diversification efforts in
the 'diversification' table have a lower budget than the average budget for all economic diversification efforts in the 'budget' table?
sql_context: CREATE TABLE diversification (id INT, effort VARCHAR(50), budget FLOAT); CREATE TABLE
budget (diversification_id INT, diversification_effort VARCHAR(50), amount FLOAT);"""


tokenizer = AutoTokenizer.from_pretrained("SwastikM/bart-large-nl2sql")
model = AutoModelForSeq2SeqLM.from_pretrained("SwastikM/bart-large-nl2sql")

inputs = tokenizer(query_question_with_context, return_tensors="pt").input_ids
outputs = model.generate(inputs, max_new_tokens=100, do_sample=False)

sql = tokenizer.decode(outputs[0], skip_special_tokens=True)
print(sql)
