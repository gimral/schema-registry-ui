# FROM httpd AS builder
# RUN apk --update add \
#   autoconf \
#   automake \
#   curl-dev \
#   g++ \
#   glib-dev \
#   libtool \
#   libxml2-dev \
#   make \
#   perl-dev \
#   py-six \
#   python \
#   xmlsec-dev \
#   zlib-dev

# #   # Install xmlsec
# # RUN cd /tmp && \
# #   wget http://www.aleksey.com/xmlsec/download/xmlsec1-1.2.25.tar.gz && \
# #   tar xzf xmlsec1-1.2.25.tar.gz && \
# #   cd xmlsec1-1.2.25 && \
# #   ./configure --enable-soap && \
# #   make && \
# #   make install

# # Install lasso
# RUN cd /tmp && \
#   wget https://dev.entrouvert.org/releases/lasso/lasso-2.5.1.tar.gz && \
#   tar zxf lasso-2.5.1.tar.gz && \
#   cd lasso-2.5.1 && \
#   ./configure && \
#   make && \
#   make install

#   # Install mod_auth_mellon
# RUN mkdir /tmp/mod_auth_mellon && \
#   cd /tmp/mod_auth_mellon && \
#   wget https://github.com/latchset/mod_auth_mellon/releases/download/v0_16_0/mod_auth_mellon-0.16.0.tar.gz && \
#   tar zxf mod_auth_mellon-0.16.0.tar.gz && \
#   cd mod_auth_mellon-0.16.0 && \
#   ./configure && \
#   make && \
#   make install

FROM node:12.7-alpine AS node_builder
WORKDIR /usr/src/app
COPY ./package.json ./
RUN npm install
COPY . .
RUN npm run build-prod



FROM httpd:2.4.43

ARG SCHEMAREGISTRY_URL=http://host.docker.internal:5051/
ENV SCHEMAREGISTRY_URL $SCHEMAREGISTRY_URL

RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
            wget \
            openssl \
            liblasso3 \
            libapache2-mod-auth-mellon

RUN apt install -y php libapache2-mod-php

COPY ./docker/html/ /usr/local/apache2/htdocs/

COPY ./docker/registry-httpd.conf /usr/local/apache2/conf/httpd.conf

COPY ./docker/saml2/* /usr/local/apache2/saml2/

RUN sed -i -e 's/SCHEMAREGISTRY_URL/${SCHEMAREGISTRY_URL}/g' /usr/local/apache2/conf/httpd.conf

ADD docker/run.sh /
RUN chmod +x /run.sh
RUN /run.sh
# Add and Setup Schema-Registry-Ui
COPY --from=node_builder /usr/src/app/dist /usr/local/apache2/htdocs
# RUN rm -f /usr/local/apache2/htdocs/index.html \
RUN rm -f /usr/local/apache2/htdocs/env.js \
    && ln -s /tmp/env.js /usr/local/apache2/htdocs/env.js

