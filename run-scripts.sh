#!/bin/bash
# Set the PROJECT_NAME environment variable
export PROJECT_NAME=${PWD##*/}
# Get the script name from the first command line argument
SCRIPT_NAME=$1
# Run the specified script with the specified project name
cd ../plugins
case $SCRIPT_NAME in
	stylelint)
		npx stylelint ../$PROJECT_NAME/src/**/*.css --fix
		;;
	yaspeller)
		npx yaspeller --only-errors --ignore-digits --find-repeat-words --file-extensions ".html,.md,.njk,.txt,.css" ../$PROJECT_NAME/src/
		;;
	validator)
		npx node-w3c-validator --input ../$PROJECT_NAME/site/**/*.html --format lint --verbose --errors-only
		;;
	htmlhint)
		npx htmlhint "../$PROJECT_NAME/site/**/*.html"
		;;
	bem)
		npx bem-validate ../$PROJECT_NAME/site/**/*.html
		;;
	sharp)
		node sharp ../$PROJECT_NAME/src/img/ ../$PROJECT_NAME/site/img/
		# node sharp ../$PROJECT_NAME/SOURCE/img_RAW/ ../$PROJECT_NAME/src/img/
		;;
	webp)
		node sharp ../$PROJECT_NAME/src/img/ ../$PROJECT_NAME/site/img/ webp
		;;
	avif)
		node sharp ../$PROJECT_NAME/src/img/ ../$PROJECT_NAME/site/img/ avif
		;;
	typograf)
		node typograf.js ../$PROJECT_NAME/site/
		;;
esac
