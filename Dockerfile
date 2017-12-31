FROM annismckenzie/node-puppeteer:6.12 as builder
COPY . /home/bodycare
WORKDIR /home/bodycare/
RUN make setup
RUN yarn build

FROM halverneus/static-file-server:latest
COPY --from=builder /home/bodycare/dist /www
ENV FOLDER /www
ENV PORT 8080
EXPOSE 8080
