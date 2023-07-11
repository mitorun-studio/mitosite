const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Передача пути в переменные при запуске:
const myPathInput = process.argv[2];
const myPathOutput = process.argv[3];
const format = process.argv[4];

// Опции для настройки сжатия изображений в разных форматах:
const sharpJpegOptions = {// JPEG:
	quality: 70,// качество "1-100", default "80".
	mozjpeg: true,// Включить настройки mozjpeg, с ними меньше размер и медленнее, default false. Опыт: заметно меньше при таком же качестве - включать!
	//chromaSubsampling: '4:4:4',// Цветовая субдискретизация, с 4:4:4 качественнее и больше размер, default '4:2:0'. Опыт показывает что размер сильно увеличивает, а улучшения качества незаметно - не включать!
	//progressive: true,// Прогрессивная чересстрочная развертка, default false. Опыт показывает что размер сильно увеличивает, а улучшения качества незаметно - не включать!
	//optimiseCoding: false,// Оптимизировать по таблицам Хоффмана, default true.
	//force: false,// Принудительно выводит файлы в .jpeg, default true.
};
const sharpPngOptions = {// PNG:
	quality: 40,// использовать минимум цветов для заданного качества (0-100?), default "100".
	//colors: 64,// макимальное количество цветов, default "256".
	dither: 0.0,// (Сглаживание?) Уровень диффузии ошибки Флойда-Стейнберга, от 0.0 до 1.0, default "1.0". Опыт: dither:0.0 уменьшает размер в 2-3 раза(!), только делает картинку пиксельной, надо изучить как картинки будут выглядеть на сайте.
	compressionLevel: 9,// сжатие zlib от "0"(fastest, largest) до "9"(slowest, smallest), default "6".
	effort: 9,// ресурсы процессора, от 0 (быстро некачественно) до 10 (медленно и качественно), default "7".
	palette: true,// Квантизация изображения на основе палитры с поддержкой альфа-канала, автоматом ставится true чтобы работали colors и quality, default false.
	//progressive: true,// Прогрессивная чересстрочная развертка, default false. Опыт: это делает файлы сильно тяжелей, качество незаметно - не применять!
	//adaptiveFiltering: true,// Адаптивная фильтрация строк, default false. Опыт: это делает файлы сильно тяжелей, качество незаметно - не применять!
	//force: false,// Принудительно выводит файлы в .png, default true.
};
const sharpWebpOptions = {// WEBP:
	quality: 75,// качество "1-100", default "80".
	//lossless: true, сжатие без потерь, default "false".
	effort: 4,// ресурсы процессора, "0-6", default "4".
};
const sharpAvifOptions = {// AVIF:
	quality: 50,// качество "1-100", default "50".
	//lossless: true, сжатие без потерь, default "false".
	effort: 8,// ресурсы процессора, "0-9", default "4".
};

let totalSizeBefore = 0;
let totalSizeAfter = 0;

// Проверка, есть ли папка куда будут сохранены обработанные файлы. Если есть - пропускает, если нет - создаёт:
if (!fs.existsSync(myPathOutput)) {
	fs.mkdirSync(myPathOutput);
}

function processDirectory(inputDir, outputDir) {
	// Проверка существования выходной папки и создание ее при необходимости:
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir);
	}

	// Чтение содержимого входной папки:
	let filenames = fs.readdirSync(inputDir);

	// Массив для хранения обещаний:
	let promises = [];

	// Обработка каждого файла/папки:
	filenames.forEach((file) => {
		const inputPath = path.join(inputDir, file);
		const fileFormat = getExtension(file);

		let outputExtension = fileFormat;
		if (format === 'webp') {
			outputExtension = 'webp';
		} else if (format === 'avif') {
			outputExtension = 'avif';
		}

		const supportedFormats = ['jpg', 'jpeg', 'png', 'webp', 'avif'];
		let outputPath;
		if (fs.statSync(inputPath).isDirectory()) {
				outputPath = path.join(outputDir, file);
		} else {
				let outputExtension = fileFormat;
				if (supportedFormats.includes(fileFormat)) {
						if (format === 'webp') {
								outputExtension = 'webp';
						} else if (format === 'avif') {
								outputExtension = 'avif';
						}
				}
				outputPath = path.join(outputDir, path.basename(file, path.extname(file)) + '.' + outputExtension);
				if (!supportedFormats.includes(fileFormat)) {
						fs.copyFileSync(inputPath, outputPath);
				}
		}

		// Проверка, является ли элемент файлом или папкой:
		if (fs.statSync(inputPath).isDirectory()) {
			// Если это папка - вызываем функцию рекурсивно для обработки содержимого папки:
			promises.push(processDirectory(inputPath, outputPath));
		} else {
			// Если это файл - обрабатываем его с помощью sharp:
			const fileFormat = getExtension(file);
			// Код ниже позволяет пропускать SVG, иначе шарп их обрабатывает в растр(?):
			if (fileFormat === 'svg') {
				//console.log('sharp: SVG not processed');
				return;
			}

			const inputSize = fs.statSync(inputPath).size;
			totalSizeBefore += inputSize;

			// Определяем с каким форматом будем работать:
			let sh = sharp(inputPath);
			if (!format || format === 'jpg/png') {
				if (fileFormat === 'jpg' || fileFormat === 'jpeg') {
					sh = sh.jpeg(sharpJpegOptions);
				} else if (fileFormat === 'png') {
					sh = sh.png(sharpPngOptions);
				}
			} else if (format === 'webp') {
				sh = sh.webp(sharpWebpOptions);
			} else if (format === 'avif') {
				sh = sh.avif(sharpAvifOptions);
			}

			// Обработка изображений:
			let promise = sh.toFile(outputPath)
				.then((info) => {
					const outputSize = fs.statSync(outputPath).size;
					totalSizeAfter += outputSize;
				})
				.catch((err) => {
					console.log(`\x1b[31mSharp: ошибка при оптимизиции изображений: ${err.message}\x1b[0m`);
				});

			promises.push(promise);
		}
	});

	return Promise.all(promises);
}

// Вызов функции для обработки изображений во входной папке:
processDirectory(myPathInput, myPathOutput).then(() => {
	const compressionRatio = 1 - totalSizeAfter / totalSizeBefore;
	const compressionPercentage = Math.ceil(compressionRatio * 100);
	console.log(`\x1b[32mSharp: изображения были сжаты на ${compressionPercentage}%\x1b[0m`);
});

function getExtension(filename) {
	let ext = path.extname(filename || '').split('.');
	return ext[ext.length - 1];
}
