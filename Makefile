BUILD_IMG=annismckenzie/node-puppeteer:6.12

.PHONY: install
install:
	@docker run --platform linux/amd64 -v $(shell pwd):/home/bodycare -w /home/bodycare/ --rm $(BUILD_IMG) yarn install

.PHONY: local-build
local-build:
	@docker run --platform linux/amd64 -v $(shell pwd):/home/bodycare -w /home/bodycare/ --rm $(BUILD_IMG) yarn build

.PHONY: preview
preview: local-build
	@pushd dist && python3 -m http.server 12345; popd
