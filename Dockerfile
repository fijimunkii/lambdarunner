FROM node:10.15.0

MAINTAINER Harrison Powers, harrisonpowers@gmail.com

RUN apt-get update && apt-get install -qq -y python-pip libpython-dev vim \
  && curl -O https://bootstrap.pypa.io/get-pip.py && python get-pip.py \
  && pip install -q awscli --upgrade \
  && apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

ADD . /root

WORKDIR /root

RUN npm i && npm i -g pm2

CMD mkdir -p /data && export DATA_DIR=/data \
  && pm2 start index.js --name lambdarunner --no-daemon
