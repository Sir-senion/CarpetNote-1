// Carpet Notes Lite - Мобильное приложение для мастеров чистки ковров
// Полная версия на vanilla JavaScript с offline support

class CarpetNotesApp {
    constructor() {
        this.currentDate = this.getTodayDate();
        this.editingRecordId = null;
        this.settings = this.loadSettings();
        this.records = this.loadRecords();
        
        this.initializeApp();
        this.bindEvents();
        this.updateRecordsList();
    }

    // Инициализация приложения
    initializeApp() {
        // Устанавливаем текущую дату
        document.getElementById('dateInput').value = this.currentDate;
    }

    // Привязка событий
    bindEvents() {
        // Навигация
        document.getElementById('settingsBtn').addEventListener('click', () => this.showSettingsModal());
        document.getElementById('addBtn').addEventListener('click', () => this.showRecordModal());
        document.getElementById('fabBtn').addEventListener('click', () => this.showRecordModal());

        // Дата
        document.getElementById('prevDateBtn').addEventListener('click', () => this.changeDate(-1));
        document.getElementById('nextDateBtn').addEventListener('click', () => this.changeDate(1));
        document.getElementById('dateInput').addEventListener('change', (e) => {
            this.currentDate = e.target.value;
            this.updateRecordsList();
        });

        // Модальное окно записи
        document.getElementById('cancelBtn').addEventListener('click', () => this.hideRecordModal());
        document.getElementById('saveBtn').addEventListener('click', () => this.saveRecord());
        document.getElementById('addCarpetBtn').addEventListener('click', () => this.addCarpet());

        // Модальное окно настроек
        document.getElementById('settingsSaveBtn').addEventListener('click', () => this.saveSettings());

        // Закрытие модалок по клику на фон
        document.getElementById('recordModal').addEventListener('click', (e) => {
            if (e.target.id === 'recordModal') this.hideRecordModal();
        });
        document.getElementById('settingsModal').addEventListener('click', (e) => {
            if (e.target.id === 'settingsModal') this.hideSettingsModal();
        });

        // Обновление расчетов при изменении полей ковров
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('carpet-input')) {
                this.updateCalculations();
            }
        });

        // Радио кнопки валют
        document.querySelectorAll('input[name="currency"]').forEach(radio => {
            radio.addEventListener('change', () => this.updateCurrencyDisplay());
        });
    }

    // Получить сегодняшнюю дату в формате YYYY-MM-DD
    getTodayDate() {
        return new Date().toISOString().split('T')[0];
    }

    // Изменить дату
    changeDate(days) {
        const date = new Date(this.currentDate);
        date.setDate(date.getDate() + days);
        this.currentDate = date.toISOString().split('T')[0];
        document.getElementById('dateInput').value = this.currentDate;
        this.updateRecordsList();
    }

    // Генерация ID
    generateId() {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }

    // Загрузка настроек
    loadSettings() {
        const defaultSettings = {
            ratePerSqM: 1000,
            currency: 'KZT'
        };
        
        try {
            const saved = localStorage.getItem('carpetNotes_settings');
            return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
        } catch (e) {
            console.error('Ошибка загрузки настроек:', e);
            return defaultSettings;
        }
    }

    // Сохранение настроек
    saveSettingsToStorage() {
        try {
            localStorage.setItem('carpetNotes_settings', JSON.stringify(this.settings));
        } catch (e) {
            console.error('Ошибка сохранения настроек:', e);
        }
    }

    // Загрузка записей
    loadRecords() {
        try {
            const saved = localStorage.getItem('carpetNotes_records');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Ошибка загрузки записей:', e);
            return [];
        }
    }

    // Сохранение записей
    saveRecordsToStorage() {
        try {
            localStorage.setItem('carpetNotes_records', JSON.stringify(this.records));
        } catch (e) {
            console.error('Ошибка сохранения записей:', e);
        }
    }

    // Получить символ валюты
    getCurrencySymbol(currency = this.settings.currency) {
        const symbols = {
            'KZT': '₸',
            'RUB': '₽',
            'USD': '$'
        };
        return symbols[currency] || '₸';
    }

    // Форматирование числа
    formatNumber(number) {
        return Math.round(number).toLocaleString('ru-RU');
    }

    // Форматирование даты дедлайна
    formatDeadline(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('ru-RU', { 
            day: 'numeric', 
            month: 'long' 
        });
    }

    // Получить количество ковров с правильным склонением
    getCarpetCountText(count) {
        if (count === 1) return '1 ковер';
        if (count >= 2 && count <= 4) return `${count} ковра`;
        return `${count} ковров`;
    }

    // Обновление списка записей
    updateRecordsList() {
        const recordsForDate = this.records.filter(record => record.date === this.currentDate);
        const recordsList = document.getElementById('recordsList');
        const emptyState = document.getElementById('emptyState');

        if (recordsForDate.length === 0) {
            recordsList.innerHTML = '';
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
            recordsList.innerHTML = recordsForDate.map(record => this.createRecordCard(record)).join('');
            
            // Привязываем события клика на карточки
            recordsList.querySelectorAll('.record-card').forEach(card => {
                card.addEventListener('click', () => {
                    const recordId = card.dataset.recordId;
                    this.editRecord(recordId);
                });
            });
        }
    }

    // Создание карточки записи
    createRecordCard(record) {
        const currencySymbol = this.getCurrencySymbol();
        const carpetCount = record.carpets.length;
        const deadline = record.deadline ? `<div class="record-deadline">Дедлайн: ${this.formatDeadline(record.deadline)}</div>` : '';
        
        return `
            <div class="record-card" data-record-id="${record.id}">
                <div class="record-header">
                    <div>
                        <div class="record-address">${record.address}</div>
                        ${deadline}
                    </div>
                    <div>
                        <div class="record-price">${currencySymbol}${this.formatNumber(record.totalPrice)}</div>
                        <div class="record-area">${record.totalArea.toFixed(1)} м²</div>
                    </div>
                </div>
                <div class="record-footer">
                    <div class="carpet-count">${this.getCarpetCountText(carpetCount)}</div>
                    <div class="status-container">
                        <div class="status-dot ${record.isDone ? 'done' : 'pending'}"></div>
                        <div class="status-text ${record.isDone ? 'done' : 'pending'}">
                            ${record.isDone ? 'Выполнено' : 'В работе'}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Показать модальное окно записи
    showRecordModal(record = null) {
        this.editingRecordId = record ? record.id : null;
        
        // Заполняем поля
        document.getElementById('modalTitle').textContent = record ? 'Редактировать' : 'Новая запись';
        document.getElementById('addressInput').value = record ? record.address : '';
        document.getElementById('deadlineInput').value = record ? record.deadline || '' : '';
        document.getElementById('isDoneSwitch').checked = record ? record.isDone : false;
        
        // Очищаем список ковров
        document.getElementById('carpetsList').innerHTML = '';
        
        if (record && record.carpets.length > 0) {
            record.carpets.forEach(carpet => this.addCarpet(carpet));
        } else {
            this.addCarpet(); // Добавляем один пустой ковер
        }
        
        this.updateCalculations();
        document.getElementById('recordModal').style.display = 'flex';
    }

    // Скрыть модальное окно записи
    hideRecordModal() {
        document.getElementById('recordModal').style.display = 'none';
        this.editingRecordId = null;
    }

    // Редактировать запись
    editRecord(recordId) {
        const record = this.records.find(r => r.id === recordId);
        if (record) {
            this.showRecordModal(record);
        }
    }

    // Добавить ковер
    addCarpet(carpet = null) {
        const carpetsList = document.getElementById('carpetsList');
        const carpetIndex = carpetsList.children.length;
        
        const carpetHtml = `
            <div class="carpet-item" data-carpet-index="${carpetIndex}">
                <div class="carpet-header">
                    <div class="carpet-title">Ковер #${carpetIndex + 1}</div>
                    <button type="button" class="remove-btn" onclick="app.removeCarpet(${carpetIndex})">Удалить</button>
                </div>
                <div class="carpet-inputs">
                    <div class="input-group">
                        <label class="input-label">Ширина (м)</label>
                        <input type="number" step="0.1" class="carpet-input" data-field="width" 
                               placeholder="0.0" value="${carpet ? carpet.width || '' : ''}">
                    </div>
                    <div class="input-group">
                        <label class="input-label">Длина (м)</label>
                        <input type="number" step="0.1" class="carpet-input" data-field="length" 
                               placeholder="0.0" value="${carpet ? carpet.length || '' : ''}">
                    </div>
                    <div class="input-group">
                        <label class="input-label">Площадь</label>
                        <div class="area-display">0.0 м²</div>
                    </div>
                </div>
            </div>
        `;
        
        carpetsList.insertAdjacentHTML('beforeend', carpetHtml);
        this.updateCarpetNumbers();
        this.updateCalculations();
    }

    // Удалить ковер
    removeCarpet(index) {
        const carpetsList = document.getElementById('carpetsList');
        const carpetItems = carpetsList.querySelectorAll('.carpet-item');
        
        if (carpetItems.length > 1) {
            carpetItems[index].remove();
            this.updateCarpetNumbers();
            this.updateCalculations();
        } else {
            this.showToast('Должен остаться хотя бы один ковер', 'error');
        }
    }

    // Обновить нумерацию ковров
    updateCarpetNumbers() {
        const carpetItems = document.querySelectorAll('.carpet-item');
        carpetItems.forEach((item, index) => {
            item.dataset.carpetIndex = index;
            item.querySelector('.carpet-title').textContent = `Ковер #${index + 1}`;
            item.querySelector('.remove-btn').setAttribute('onclick', `app.removeCarpet(${index})`);
        });
    }

    // Обновить расчеты
    updateCalculations() {
        const carpetItems = document.querySelectorAll('.carpet-item');
        let totalArea = 0;
        
        carpetItems.forEach(item => {
            const widthInput = item.querySelector('[data-field="width"]');
            const lengthInput = item.querySelector('[data-field="length"]');
            const areaDisplay = item.querySelector('.area-display');
            
            const width = parseFloat(widthInput.value) || 0;
            const length = parseFloat(lengthInput.value) || 0;
            const area = width * length;
            
            areaDisplay.textContent = `${area.toFixed(1)} м²`;
            totalArea += area;
        });
        
        const totalPrice = totalArea * this.settings.ratePerSqM;
        
        document.getElementById('totalArea').textContent = `${totalArea.toFixed(1)} м²`;
        document.getElementById('totalPrice').textContent = 
            `${this.getCurrencySymbol()}${this.formatNumber(totalPrice)}`;
        document.getElementById('currentRate').textContent = 
            `${this.getCurrencySymbol()}${this.formatNumber(this.settings.ratePerSqM)}`;
    }

    // Собрать данные ковров
    getCarpetsData() {
        const carpetItems = document.querySelectorAll('.carpet-item');
        const carpets = [];
        
        carpetItems.forEach(item => {
            const width = parseFloat(item.querySelector('[data-field="width"]').value) || 0;
            const length = parseFloat(item.querySelector('[data-field="length"]').value) || 0;
            const area = width * length;
            
            carpets.push({ width, length, area });
        });
        
        return carpets;
    }

    // Сохранить запись
    saveRecord() {
        const address = document.getElementById('addressInput').value.trim();
        
        if (!address) {
            this.showToast('Адрес обязателен для заполнения', 'error');
            return;
        }
        
        const carpets = this.getCarpetsData();
        const totalArea = carpets.reduce((sum, carpet) => sum + carpet.area, 0);
        const totalPrice = totalArea * this.settings.ratePerSqM;
        
        const recordData = {
            address,
            date: this.currentDate,
            deadline: document.getElementById('deadlineInput').value || null,
            isDone: document.getElementById('isDoneSwitch').checked,
            carpets,
            totalArea,
            totalPrice
        };
        
        if (this.editingRecordId) {
            // Обновляем существующую запись
            const recordIndex = this.records.findIndex(r => r.id === this.editingRecordId);
            if (recordIndex !== -1) {
                this.records[recordIndex] = { ...this.records[recordIndex], ...recordData };
                this.showToast('Запись обновлена', 'success');
            }
        } else {
            // Создаем новую запись
            const newRecord = {
                id: this.generateId(),
                ...recordData
            };
            this.records.push(newRecord);
            this.showToast('Запись создана', 'success');
        }
        
        this.saveRecordsToStorage();
        this.updateRecordsList();
        this.hideRecordModal();
    }

    // Показать модальное окно настроек
    showSettingsModal() {
        document.getElementById('rateInput').value = this.settings.ratePerSqM;
        document.querySelector(`input[name="currency"][value="${this.settings.currency}"]`).checked = true;
        this.updateCurrencyDisplay();
        document.getElementById('settingsModal').style.display = 'flex';
    }

    // Скрыть модальное окно настроек
    hideSettingsModal() {
        document.getElementById('settingsModal').style.display = 'none';
    }

    // Обновить отображение валюты в настройках
    updateCurrencyDisplay() {
        const checkedRadio = document.querySelector('input[name="currency"]:checked');
        document.querySelectorAll('.radio-check').forEach(check => {
            check.style.opacity = '0';
        });
        if (checkedRadio) {
            checkedRadio.closest('.radio-option').querySelector('.radio-check').style.opacity = '1';
        }
    }

    // Сохранить настройки
    saveSettings() {
        const rate = parseFloat(document.getElementById('rateInput').value);
        const currency = document.querySelector('input[name="currency"]:checked').value;
        
        if (!rate || rate <= 0) {
            this.showToast('Введите корректный тариф', 'error');
            return;
        }
        
        this.settings.ratePerSqM = rate;
        this.settings.currency = currency;
        
        this.saveSettingsToStorage();
        this.showToast('Настройки сохранены', 'success');
        this.hideSettingsModal();
        this.updateRecordsList(); // Обновляем отображение для новой валюты
    }

    // Показать уведомление
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.style.display = 'block';
        
        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }
}

// Инициализация приложения
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new CarpetNotesApp();
});

// Предотвращение случайного обновления страницы
window.addEventListener('beforeunload', (e) => {
    // Сохраняем данные перед закрытием
    if (app) {
        app.saveRecordsToStorage();
        app.saveSettingsToStorage();
    }
});

// Обработка офлайн/онлайн состояния
window.addEventListener('online', () => {
    console.log('Приложение подключено к интернету');
});

window.addEventListener('offline', () => {
    console.log('Приложение работает в офлайн режиме');
});

// Добавление в избранное / на главный экран
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('PWA установка доступна');
    deferredPrompt = e;
});

// Обработка установки PWA
window.addEventListener('appinstalled', () => {
    console.log('PWA успешно установлено');
    deferredPrompt = null;
});