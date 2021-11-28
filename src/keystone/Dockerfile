FROM node:16-alpine AS dependencies

WORKDIR /app
COPY package.json package.json
COPY yarn.lock yarn.lock
RUN SKIP_POSTINSTALL=1 yarn install

FROM node:16-alpine AS prod

WORKDIR /app
COPY package.json package.json
COPY tsconfig.json tsconfig.json
COPY keystone.ts keystone.ts
COPY schema.ts schema.ts
COPY auth.ts auth.ts
COPY --from=dependencies /app/node_modules node_modules
EXPOSE 3000
CMD yarn deploy && yarn start