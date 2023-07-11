const fs = require('fs').promises;
const path = require('path');
const Typograf = require('typograf');
const tp = new Typograf({
	locale: ['ru', 'en-US'],
	disableRule: [
		//'common/nbsp/afterShortWord',// Неразрывный пробел после короткого слова (№12)
		'common/number/fraction',// 1/2 → ½, 1/4 → ¼, 3/4 → ¾ (№19)
		'common/number/mathSigns',// != → ≠, <= → ≤, >= → ≥, ~= → ≅, +- → ± (№20)
		//'common/number/times',// x → × (10 x 5 → 10×5) (№21)
		//'common/punctuation/hellip',// Замена трёх точек на многоточие (№26)
		'common/punctuation/quote',// Расстановка кавычек правильного вида (№27)
		'common/space/replaceTab',// Замена таба на 4 пробела (№45)
		'common/symbols/cf',// Добавление ° к C и F (№50)
		//'en-US/dash/main',// Замена дефиса на длинное тире (№52)
		//'ru/dash/main',// Замена дефиса на тире (№63)
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

const inputDir = process.argv[2];
let processedFiles = 0;
let totalFiles = 0;

async function processFile(filePath) {
	try {
		const data = await fs.readFile(filePath, 'utf8');
		const result = tp.execute(data);
		await fs.writeFile(filePath, result, 'utf8');
		processedFiles++;
		console.log(`\x1b[32mTypograf: Файл обработан ${filePath}\x1b[0m`);
	} catch (error) {
		console.log(`\x1b[31mTypograf: Ошибка при обработке ${filePath}\x1b[0m`);
		console.error(error);
	}
}

async function processDirectory(dirPath) {
	const files = await fs.readdir(dirPath);
	const promises = files.map(async file => {
		const filePath = path.join(dirPath, file);
		const stats = await fs.stat(filePath);
		if (stats.isDirectory()) {
			await processDirectory(filePath);
		} else if (stats.isFile() && path.extname(file) === '.html') {
			totalFiles++;
			await processFile(filePath);
		}
	});
	await Promise.all(promises);
}

async function main() {
	await processDirectory(inputDir);
	console.log(`Все файлы были оттипографированы. Общее количество файлов: ${totalFiles}`);
}

main();
