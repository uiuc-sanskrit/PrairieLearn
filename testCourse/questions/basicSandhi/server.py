import random

wordlist = [
    ['सीता', 'अश्वम्', 'सीताश्वम् '],
    ['सीता', 'इषुम्', 'सीतेषुम्']
]

def generate(data):
    i = random.randint(0, len(wordlist) - 1)

    # Put these two integers into data['params']
    data["params"]["a"] = wordlist[i][0]
    data["params"]["b"] = wordlist[i][1]

    # Put the sum into data['correct_answers']
    data["correct_answers"]["c"] = wordlist[i][2]
