.PHONY: setup build-image

IMG=annismckenzie/node-grunt-yarn
NODE_VERSION=6.12
PWD=`pwd`

run:
	@docker run -p 8000:8000 -v $(PWD):/home/bodycare --rm -it $(IMG):$(NODE_VERSION)

setup:
	@ cd vendor/photoswipe && yarn install --cache-folder .yarn-cache && cd ../../
	@ yarn install --cache-folder .yarn-cache
