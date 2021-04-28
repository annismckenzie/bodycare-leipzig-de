.PHONY: setup run local-build build

BUILD_IMG=annismckenzie/node-puppeteer:6.12
PWD=`pwd`

run: install
	@docker run -p 8000:8000 -w /home/bodycare/ -v $(PWD):/home/bodycare --rm -it $(BUILD_IMG) yarn start

install:
	@docker run -p 8000:8000 -w /home/bodycare/ -v $(PWD):/home/bodycare --rm -it $(BUILD_IMG) yarn install

local-build:
	@docker run -v $(PWD):/home/bodycare -w /home/bodycare/ --rm $(BUILD_IMG) yarn build

preview:
	@make local-build && pushd dist && python3 -m http.server 12345; popd

setup:
	@ npm install -g bower
	@ bower --allow-root install
	@ git submodule update --init
	@ cd vendor/photoswipe && yarn install --cache-folder .yarn-cache && cd ../../
	@ yarn install --cache-folder .yarn-cache

IMG=annismckenzie/bodycare_leipzig_de

build:
	@docker build -t=$(IMG):1.0 .
