FROM node:18-alpine

WORKDIR /app

COPY chaincode/package*.json ./
RUN npm ci --only=production

COPY chaincode/ ./

EXPOSE 9999

ENV CHAINCODE_SERVER_ADDRESS=0.0.0.0:9999

# Use fabric-chaincode-node's server command for CaaS
CMD sh -c "npx fabric-chaincode-node server --chaincode-address=${CHAINCODE_SERVER_ADDRESS} --chaincode-id=${CHAINCODE_ID}"
