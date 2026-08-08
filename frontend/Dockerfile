FROM node:22.19.0-alpine AS build

WORKDIR /workspace

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

FROM nginx:1.29.3-alpine

ENV LABFLOW_OIDC_FORM_ACTION_ORIGIN=http://keycloak.localhost:8180 \
    NGINX_ENVSUBST_FILTER=^LABFLOW_

COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /workspace/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=5 \
    CMD wget --quiet --output-document=- http://127.0.0.1/healthz || exit 1
