# lambdarunner

Run aws lambda functions on autoscaling ec2 instances

```
docker run -d -p 5555:5555 -v $(mktemp -d):/data fijimunkii/lambdarunner

curl http://localhost:5555?functionName=asdf&qualifier=1337&config=%7B%22options%22%3Atrue%7D&context=%7B%7D
```
