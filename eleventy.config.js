const htmlMinifierTerser = require('html-minifier-terser');
const lightningCSS = require('@11tyrocks/eleventy-plugin-lightningcss');
// const esbuild = require('esbuild');
const pluginBundle = require('@11ty/eleventy-plugin-bundle');
const eleventyNavigationPlugin = require('@11ty/eleventy-navigation');
const typograf = require('typograf');
const markdownIt = require('markdown-it')({ html: true });




module.exports = function(eleventyConfig) {

	//------------------------------------------------
	// Настройки Eleventy: ---------------------------
	//------------------------------------------------

	// Настройка параметров сервера: -----------------
	eleventyConfig.setServerOptions({
		//watch: ['site/**/*.css'],
		showAllHosts: true, // Показать локальные IP-адреса сети для тестирования устройств.
	});
	// Задержка в отслеживании (watch):
	eleventyConfig.setWatchThrottleWaitTime(1000); // 0ms default.

	// Отслеживание (watch) картинок для конвейера (pipeline):
	//eleventyConfig.addWatchTarget('img/**/*.{svg,avif,webp,png,jpg,jpeg}');


	// Плагины: --------------------------------------

	eleventyConfig.addPlugin(pluginBundle, {
		// Папка в выходном каталоге куда будут записываться файлы пакетов:
		toFileDirectory: 'bundle',
		// Дополнительные имена бандлов ('css', 'js', 'html' есть по умолчанию):
		bundles: [],
		// Array of async-friendly callbacks to transform bundle content.
		// Работают с getBundle и getBundleFileUrl:
		transforms: [],
		// Array of bundle names eligible for duplicate bundle hoisting
		hoistDuplicateBundlesFor: [], // e.g. ['css', 'js']
	});

	eleventyConfig.addPlugin(eleventyNavigationPlugin);




	//------------------------------------------------
	// Фильтры для переменных: -----------------------
	//------------------------------------------------

	// Фильтр для удобочитаемой русской даты:
	// Использование: "{{ date | readableDate }}", результат: "13 ноября 2022":
	eleventyConfig.addFilter('readableDate', function(value) {
		return value.toLocaleString('ru', {
			day: 'numeric',
			month: 'long', // long | short.
			year: 'numeric'
		}).replace(' г.', '');
	});

	// Добавление функционала маркдауна {{ content | markdown | safe }}
	eleventyConfig.addFilter('markdown', function(value) {
		return markdownIt.render(value);
	});

	// Добавление функционала маркдауна инлайн {{ post.title | markdownInline | safe }}
	eleventyConfig.addFilter('markdownInline', function(value) {
		return markdownIt.renderInline(value);
	});

	eleventyConfig.setLibrary('md', markdownIt);




	//------------------------------------------------
	// Шорткоды: -------------------------------------
	//------------------------------------------------

	// Добавить текущий год {% year %}:
	eleventyConfig.addShortcode('year', () => `${new Date().getFullYear()}`);

	// Генерация картинки OpenGraph для каждой страницы {% opengraph _site.siteUrl %}:
	eleventyConfig.addShortcode('encodeuri', function (baseUrl) {
		const pathPrefix = eleventyConfig.pathPrefix || '';
		const encodedURL = encodeURIComponent(baseUrl + pathPrefix + this.page.url);
		return encodedURL;
	});


	//------------------------------------------------
	// Обработка HTML: -------------------------------
	//------------------------------------------------

	eleventyConfig.addTransform('typograf', function (content, path) {
		if (path.endsWith('.html') || path.endsWith('.md')) {
				const tp = new typograf({
					locale: ['ru', 'en-US'],
					disableRule: [
						//'common/nbsp/afterShortWord',// Неразрывный пробел после короткого слова (№12)
						'common/number/fraction',// 1/2 → ½, 1/4 → ¼, 3/4 → ¾ (№19)
						'common/number/mathSigns',// != → ≠, <= → ≤, >= → ≥, ~= → ≅, +- → ± (№20)
						//'common/number/times',// x → × (10 x 5 → 10×5) (№21)
						//'common/punctuation/hellip	',// Замена трёх точек на многоточие (№26)
						'common/punctuation/quote',// Расстановка кавычек правильного вида (№27)
						'common/space/replaceTab',// Замена таба на 4 пробела (№45)
						'common/symbols/cf',// Добавление ° к C и F (№50)
						'en-US/dash/main',// Замена дефиса на длинное тире (№52)
						'ru/dash/main',// Замена дефиса на тире (№63)
						'ru/dash/surname',// Сокращения с помощью тире (№65)
						'ru/date/fromISO',// Преобразование дат YYYY-MM-DD к виду DD.MM.YYYY (№71)
						'ru/number/comma',// Замена точки на запятую в числах (№91)
						//'ru/other/phone-number',// Форматирование телефонных номеров "+7 495 123-45-67" (№97)
						'ru/punctuation/exclamation',// !! → ! (№99)
						'ru/punctuation/exclamationQuestion',// !? → ?! (№100)
						'ru/punctuation/hellipQuestion',// «?…» → «?..», «!…» → «!..», «…,» → «…» (№101)
						'ru/typo/switchingKeyboardLayout'// Замена латинских букв на русские. Опечатки, возникающие при переключении клавиатурной раскладки (№105)
					],
					enableRule: [
						//'common/html/stripTags',// Удаление HTML-тегов (№7)
						//'common/nbsp/afterNumber',// Неразрывный пробел между числом и словом (№9)
						//'common/nbsp/replaceNbsp',// Замена неразрывного пробела на обычный перед типографированием (№17)
						//'common/number/digitGrouping',// Разбивать длинные числа по разрядам (№18)
						//'ru/optalign/bracket',// для открывающей скобки (№93)
						//'ru/optalign/comma',// для запятой (№94)
						//'ru/optalign/quote',// для открывающей кавычки (№95)
						//'ru/other/accent',// Замена заглавной буквы на строчную с добавлением ударения (№96)
					],
					safeTags: [
						['<\\?php', '\\?>'],
						['<no-typography>', '</no-typography>']
					]
				});
				return tp.execute(content);
		}
		return content;
	});




	// Добавление преобразования для минимизации HTML-файлов:
	eleventyConfig.addTransform('html-minify', function (content, path) {
		if (path && path.endsWith('.html')) {
			return htmlMinifierTerser.minify(
				content, {
					removeComments: true,// Удалить комментарии (default: false).
					collapseWhitespace: true,// Удалить пробелы в текстовых областях. Это может испортить текст внутри <code>, опасная настройка (default: false).
					removeScriptTypeAttributes: true,// Удалить type="text/javascript" из script тегов (default: false).
					removeStyleLinkTypeAttributes: true,// Удалить type="text/css" из style и link тегов (default: false).
					removeRedundantAttributes: true,// Удалять атрибуты со значением по умолчанию, с этим нужно осторожно (default: false).
					collapseBooleanAttributes: true,// Удалять логические атрибуты типа disabled="disabled", с этим нужно осторожно (default: false).
					decodeEntities: true,// Использовать прямые символы Unicode, не уверен что нужно (default: false).
					includeAutoGeneratedTags: false,// Вставка тегов, сгенерированных парсером HTML, не уверен что нужно (default: true).
					minifyCSS: true,// Минифицировать встроенный CSS используя clean-css (default: false).
					minifyJS: true,// Минифицировать встроенный JS используя UglifyJS (default: false).
					//quoteCharacter: "",// Тип кавычек для значений атрибутов (' or ").

					// Настройки для экстремального сжатия:
					//collapseInlineTagWhitespace: true,// Это убирает нужные пробелы между инлайновыми тегами, например у ссылок в тексте, лучше не включать эту настройку (default: false)!
					//sortAttributes: true,// Сортировать атрибуты по частоте, для лучшего сжатия gzip (default: false).
					//sortClassName: true,// Сортировать классы стилей по частоте, для лучшего сжатия gzip (default: false).
					//removeAttributeQuotes: true,// Удалить кавычки у атрибутов, только для экстремального сжатия (default: false).
					//removeOptionalTags: true,// Удалить необязательные теги, только для экстремального сжатия. На практике он удалял закрывающие </p> из-за чего браузер далее создавал пустые теги <p>, лучше не включать эту настройку (default: false)!
					//minifyURLs: false(default ) | String | Object | Function(text)(использует relateurl, пока думаю не стоит включать) (default: false).
				}
			);
		}
		return content;
	});


	//------------------------------------------------
	// Обработка CSS: --------------------------------
	//------------------------------------------------

	// Добавление плагина LightningCSS:
	eleventyConfig.addPlugin(lightningCSS, {
		//importPrefix: '_', // Тип: строка, по умолчанию: '_'.
		//nesting: true, // Тип: логический, по умолчанию: true.
		//customMedia: true, // Тип: логический, по умолчанию: true.
		//minify: true, // Тип: логический, по умолчанию: true.
		//sourceMap: false, // Тип: логический, по умолчанию: false.
		// visitors: [], // Тип: массив, по умолчанию: [].
		// customAtRules: {} // Тип: объект, по умолчанию: {}.
	});




	//------------------------------------------------
	// Обработка JS: ---------------------------------
	//------------------------------------------------

	//eleventyConfig.addTemplateFormats('js');

	//eleventyConfig.addExtension('js', {
	//	outputFileExtension: 'js',
	//	compile: async (content, path) => {
	//		if (path !== './src/scripts.js') {
	//			return;
	//		}
	//		return async () => {
	//			return esbuild.buildSync({
	//				entryPoints: [path],
	//				minify: true,
	//				bundle: true,
	//				write: false,
	//			}).outputFiles[0].text;
	//		}
	//	}
	//});




	//------------------------------------------------
	// Обработка SVG: --------------------------------
	//------------------------------------------------

	// Тут должны быть: сборка спрайта, минификация всех SVG с SVGO, создание нужных фавиконок из файла favicon.svg




	//------------------------------------------------
	// Прямое копирование файлов и папок: ------------
	//------------------------------------------------

	eleventyConfig.addPassthroughCopy('src/img');
	//eleventyConfig.addPassthroughCopy('src/img/**/*.{svg,avif,webp,jxl,jpg,jpeg,png,tif,tiff,bmp,gif}');
	eleventyConfig.addPassthroughCopy('src/fls');
	eleventyConfig.addPassthroughCopy('src/*.{js,php,txt,xml,json,webmanifest,htaccess,ico}');

	//eleventyConfig.addPassthroughCopy({
	//	'./public/': '/',
	//	'./node_modules/prismjs/themes/prism-okaidia.css': '/css/prism-okaidia.css'
	//});




	//------------------------------------------------
	// Настройка путей, папок и движков: -------------
	//------------------------------------------------

	return {
		//pathPrefix: '/kirshmelev.ru/', // Указываем имя репозитория на Github (можно оставить пустым, если не используется).
		addPassthroughFileCopy: true,
		dataTemplateEngine: 'njk',
		markdownTemplateEngine: 'njk',
		htmlTemplateEngine: 'njk',
		templateFormats: ['html', 'njk', 'md'],
		dir: {
			input: 'src',
			output: 'site',
			includes: '_includes',
			layouts: '_includes',
			data: '_includes'
		}
	};
};
