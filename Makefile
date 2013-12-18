#
# Beez Project: Makefile
#

PROJECTNAME="beez-foundation"
DESC="beez"
DIST_SRC="dist"
RELEASE_SRC="release"

__tar=$(shell which tar)
__tar_package_prefix=$(__tar)

all: help

help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "\tsetup\t:\tnpm install ."
	@echo "\texample\t:\texample server start"
	@echo ""
	@echo "\thelp\t:\thelp message"

setup:
	npm install .

example:
	./f/beez.js -c example/json/local.json

.PHONY: all help setup example
