import formats from './formats.json';

function formatMoney(cents, formatString) {
    if (typeof cents == 'string') {
        cents = cents.replace('.', '');
    }

    let value = '';
    let placeholderRegex = /{{\s*(\w+)\s*}}/;

    function formatWithDelimiters(number, precision=2, thousands=',', decimal='.') {
        if (isNaN(number) || number == null) {
            return 0;
        }

        number = (number / 100.0).toFixed(precision);

        let parts = number.split('.'),
            dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands),
            cents = parts[1] ? (decimal + parts[1]) : '';

        return dollars + cents;
    }

    switch (formatString.match(placeholderRegex)[1]) {
        case 'amount':
            value = formatWithDelimiters(cents, 2);
            break;
        case 'amount_no_decimals':
            value = formatWithDelimiters(cents, 0);
            break;
        case 'amount_with_comma_separator':
            value = formatWithDelimiters(cents, 2, '.', ',');
            break;
        case 'amount_no_decimals_with_comma_separator':
            value = formatWithDelimiters(cents, 0, '.', ',');
            break;
        case 'amount_with_apostrophe_separator':
            value = formatWithDelimiters(cents, 0, '\'', '.');
            break;
    }

    return formatString.replace(placeholderRegex, value);
}

const getCurrencyPlugins = [
    () => window.BOLDCURRENCY.currentCurrency && BOLDCURRENCY.currentCurrency,
    () => window.Currency.currentCurrency && Currency.currentCurrency,
    () => window.DoublyGlobalCurrency.currentCurrency && DoublyGlobalCurrency.currentCurrency,
    () => document.querySelector('.autoketing-currency-convert-currency-selected').innerText.trim(),
    () => window.Shopify.currency.active,
    () => window.ShopifyAnalytics.meta.currency
]

const formatMoneyPlugins = [
    (currency, cents, format) => BOLDCURRENCY.converter.formatMoney(
        BOLDCURRENCY.converter.convertPrice(cents, currency)
    ),
    (currency, cents, format) => Currency.formatMoney(
        Currency.convert(
            cents,
            window.Shopify.currency.active,
            currency
        ),
        Currency.moneyFormats[currency][format]
    ),
    (currency, cents, format) => DoublyGlobalCurrency.formatMoney(
        DoublyGlobalCurrency.convert(
            cents,
            window.Shopify.currency.active,
            currency
        ),
        DoublyGlobalCurrency.moneyFormats[currency][format]
    ),
    (currency, cents, format) => {
        const rates = JSON.parse(localStorage['autoketing-currency-get-rate-v2']);
        const value = (cents / rates[window.Shopify.currency.active].rate) * rates[currency].rate;
        return formatMoney(value, rates[currency][format]);
    },
    (currency, cents, format) => formatMoney(cents, formats[currency][format])
];

function getCurrentCurrency(){
    for(const plugin of getCurrencyPlugins){
        try{
            let value = plugin();
            if(value){
                return value;
            }
        }catch{}
    }
}

function extractText(value){
    const div = document.createElement('div');
    div.innerHTML = value;
    return div.innerText;
}

function formatMoneyWithConversion(cents, format, html=true){
    const currency = getCurrentCurrency();
    for(const plugin of formatMoneyPlugins) {
        try {
            let value = plugin(currency, cents, format);
            if(value) {
                return html ? value : extractText(value);
            }
        } catch {
        }
    }
}

// snake case used to align with shopify filter naming
function money_format(cents, html=true){
    return formatMoneyWithConversion(cents, 'money_format', html);
}

function money_with_currency_format(cents, html=true){
    return formatMoneyWithConversion(cents, 'money_with_currency_format', html);
}

export default {
    formats,
    formatMoney,
    getCurrentCurrency,
    formatMoneyWithConversion,
    money_format,
    money_with_currency_format
}