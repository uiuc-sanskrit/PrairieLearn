# Mounting on PL

1. [Install the PrairieLearn Docker image](https://prairielearn.readthedocs.io/en/latest/installing/#installation-instructions)
2. From the root of the repo, run `docker run -it --rm -p 3000:3000 -v ./testCourse:/course prairielearn/prairielearn` (make sure docker desktop is running when you do this)
3. Go to [ localhost:3000](localhost:3000) to view PL
4. Click load from disk to upload course info
