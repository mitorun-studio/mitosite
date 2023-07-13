module.exports = {
	plugins: [
		{// Настройка или удаление плагинов по умолчанию (Yes):
			name: 'preset-default', params: {
				overrides: {
					// Пример настройки параметры плагинов по умолчанию:
					// inlineStyles: {
					// 	onlyMatchedOnce: false,
					// },

					// Округляет числа до фикс. точности:
					// cleanupNumericValues: {},

					// Удаляет атрибут ViewBox:
					removeViewBox: false,
				},
			},
		},
		// Добавление новых плагинов:

		// Удаляет width/height и добавить viewBox (надо отключить removeViewBox):
		'removeDimensions',

		// Удаляет атрибут xmlns у встроенных SVG:
		'removeXMLNS',
	]
};
