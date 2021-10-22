var formMode;
var indexItem;

const utils = {

    formatCurrency(value) {
        let signal = Number(value) < 0 ? "-" : "+"
        if (Number(value) == 0) signal = ""
        value = String(value).replace(/\D/g, "")
        value = Number(value) / 100
        value = value.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        })
        return signal + value
    },

    formatDescription(description) {
        [firstLetter, ...restLetters] = description
        description = [firstLetter.toUpperCase(), ...restLetters].join("")
        return description
    },

    formatAmount(value) {
        value = Number(value) * 100
        value = Math.round(value)
        return value
    },

    formatDate(date) {
        const splittedDate = date.split("-")
        let formattedDate = new Array
        splittedDate.forEach(format => formattedDate.unshift(format))
        formattedDate = formattedDate.join("/")
        return formattedDate
    },

    unformatAmount(value) {
        value = Number(value) / 100
        return value
    },

    unformatDate(date) {
        const splittedDate = date.split("/")
        let formattedDate = new Array
        splittedDate.forEach(format => formattedDate.unshift(format))
        formattedDate = formattedDate.join("-")
        return formattedDate
    },

    unformatCurrency(value) {
        const signal = Number(value) < 0 ? "-" : "+"
        value = String(value).replace(/\D/g, "")
        value = Number(value)
        return parseInt(signal + value)
    }

}

const Modal = { 
    toggleState(mode) { 
        formMode = mode
        Form.clearFields()
        document.querySelector('.modal-overlay').classList.toggle('active')
    },

    toggleScreen(index, confirm) {
        document.querySelector('.modal-overlay-confirm').classList.toggle('active')
        if (confirm == 'yes') Transaction.remove(index)
    },

    eventListener(eventStatus = false) {
        document.querySelector('.modal').addEventListener("click", () => eventStatus = true)
        document.querySelector('.modal-overlay').addEventListener("click", () => {
            if (!eventStatus) Modal.toggleState()
            else eventStatus = false
        })
    }
}

const Storage = {
    get() {
        return JSON.parse(localStorage.getItem('hide.finances:transactions')) || []
    },
    set(transactions) {
        localStorage.setItem("hide.finances:transactions", JSON.stringify(transactions))
    }
}

const Transaction = {
    all: Storage.get(),

    add(transaction) {

        if (formMode == 'new') Transaction.all.push(transaction)
            else if (formMode == 'edit') {
                Transaction.all.splice(indexItem, 1)
                Transaction.all.push(transaction)
            }
        
        App.reload()
    },

    remove(index) {
        Transaction.all.splice(index, 1)

        App.reload()
    },

    edit(index) {
        Modal.toggleState('edit')
        DOM.editTransaction(index)
    },

    incomes() {
        let incomes = [0]
        Transaction.all.map(transactions => {
            if (transactions.amount > 0) incomes.push(transactions.amount)
        })

        let totalIncomes = incomes.reduce((total, value) => total + value)
        totalIncomes = utils.formatCurrency(totalIncomes)
        return totalIncomes
    },

    expenses() {
        let expenses = [0]
        Transaction.all.map(transactions => {
            if (transactions.amount < 0) expenses.push(transactions.amount)
        })

        let totalExpenses = expenses.reduce((total, value) => total + value)
        totalExpenses = utils.formatCurrency(totalExpenses)
        return totalExpenses
    },

    total() {
        let totalAmount = [0]
        let totalIncomes = utils.unformatCurrency(Transaction.incomes())
        let totalExpenses = utils.unformatCurrency(Transaction.expenses())
        totalAmount = totalIncomes - totalExpenses
        if (totalAmount > 0) {
            document.querySelector('.card.total').classList.add('green')
            document.querySelector('.card.total').classList.remove('red')
        }
        else if (totalAmount < 0) {
            document.querySelector('.card.total').classList.add('red')
            document.querySelector('.card.total').classList.remove('green')

        }
        else document.querySelector('.card.total').classList.remove('red', 'green')
        totalAmount = utils.formatCurrency(totalAmount);
        return totalAmount
    },
}

const DOM = {
    transactionsContainer: document.querySelector('#data-table tbody'),

    // Atualiza o balanço: entradas, saídas e total.
    updateBalance() {
        document
            .getElementById('incomes-display')
            .innerHTML = Transaction.incomes()
        document
            .getElementById('expenses-display')
            .innerHTML = Transaction.expenses()
        document
            .getElementById('total-amount-display')
            .innerHTML = Transaction.total()
    },

    // Adicionar uma nova transação.
    addTransaction(transactions, index) {

        const tr = document.createElement('tr')
        tr.innerHTML = DOM.innerHTMLTransaction(transactions, index)
        index = tr.dataset.index
        DOM.transactionsContainer.appendChild(tr)
        
        document.querySelector('#form h2').innerHTML = `Nova transação`

    },

    editTransaction(index) {
        document.querySelector('#description').value = Transaction.all[index].description
        const formattedAmount = utils.unformatAmount(Transaction.all[index].amount)
        document.querySelector('#amount').value = formattedAmount
        const formattedDate = utils.unformatDate(Transaction.all[index].date)
        document.querySelector('#date').value = formattedDate
        const titleConteiner = document.querySelector('#form h2')
        titleConteiner.innerHTML = `Editar Transação`
        indexItem = index
    },

    // Realiza as devidas alterações no HTML.
    innerHTMLTransaction(transactions, index) {

        const formattedAmount = utils.formatCurrency(transactions.amount)
        const CSSClass = transactions.amount > 0 ? "income" : "expense"

        const html = `
        <td class="description">${transactions.description}</td>
        <td class="${CSSClass}">${formattedAmount}</td>
        <td class="date">${transactions.date}</td>
        <td class="icons-field">
            <img class="edit-icon" weight=25px height=25px onclick="Transaction.edit(${index})"src="./assets/img/edit.svg" alt="logo edit transaction"/>
            <img class="remove-icon" onclick="Modal.toggleScreen(${index})"src="./assets/img/minus.svg" alt="logo remove transaction"/>
        </td>
        `
        return html

    },

    clearTransactions() {
        DOM.transactionsContainer.innerHTML = ""
        document.querySelector('#form h2').innerHTML = `Nova transação`
    }
}

const Form = {
    description: document.querySelector('input#description'),
    amount: document.querySelector('input#amount'),
    date: document.querySelector('input#date'),

    getValues() {
        return {
            description: Form.description.value,
            amount: Form.amount.value,
            date: Form.date.value
        }
    },

    validateFields() {
        const { description, amount, date } = Form.getValues()

        if (description.trim() === "" ||
            amount.trim() === "" ||
            date.trim() === "") throw new Error("Por favor, preencha todos os campos!")
    },

    formatValues() {
        let { description, amount, date } = Form.getValues()
        description = utils.formatDescription(description)
        amount = utils.formatAmount(amount)
        date = utils.formatDate(date)

        return {
            description,
            amount,
            date
        }
    },

    saveTransaction(transaction) {
        Transaction.add(transaction)
    },

    submit(event) {
        event.preventDefault()
        try {
            Form.validateFields()
            const transaction = Form.formatValues()
            Form.saveTransaction(transaction)
            Modal.toggleState('new')
            Form.clearFields()
        }
        catch (error) {
            alert(error.message)
        }
    },

    clearFields() {
        Form.description.value = ""
        Form.amount.value = ""
        Form.date.value = ""
    }
}

const App = {

    init() {
        Transaction.all.forEach((transactions, index) => DOM.addTransaction(transactions, index))

        DOM.updateBalance()

        Storage.set(Transaction.all)

        Modal.eventListener()
    },

    reload() {
        DOM.clearTransactions()
        App.init()
    }
}

App.init() 
