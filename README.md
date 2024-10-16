# Mounting on PL

1. [Install the PrairieLearn Docker image](https://prairielearn.readthedocs.io/en/latest/installing/#installation-instructions)
2. From the root of the repo, run `docker run -it --rm -p 3000:3000 -v ./testCourse:/course prairielearn/prairielearn` (make sure docker desktop is running when you do this)
3. Go to [ localhost:3000](localhost:3000) to view PL
4. Click load from disk to upload course info

## DB Notes

- You must access the DB from the campus network - use the UIUC VPN if you're off campus. Also, the VPN doesn't tunnel WSL/Ubuntu traffic by default, look at [this thread](https://superuser.com/questions/1630487/no-internet-connection-ubuntu-wsl-while-vpn) to solve that.
- You have the change the default character set to `utf8mb4_unicode_ci` in order for it to store the full range of unicode characters. 