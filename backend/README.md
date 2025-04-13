uvicorn main:app --reload --port 8000

Upon receiving the tax declaration (format:: fillable PDF form) as an input, it is being parced to extract the financial variables required for the derivation of the optimal mortgage scheme for the user given their financial profile.
When mapping the financial variables of the class `client_finance` to the tax declaration fields, the following logic is used:

![image](https://github.com/user-attachments/assets/26f20a34-5e8b-4285-ae90-ad78ad866504)
