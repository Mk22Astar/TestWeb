document.addEventListener('DOMContentLoaded', () => {
    // Элементы интерфейса
    const inputText = document.getElementById('input-text');
    const outputText = document.getElementById('output-text');
    const generateBtn = document.getElementById('generate-btn');
    const copyBtn = document.getElementById('copy-btn');
    const pdfBtn = document.getElementById('pdf-btn');
    const wordBtn = document.getElementById('word-btn');
    const testPreview = document.getElementById('test-preview');
    const testTitle = document.getElementById('test-title');
    const questionsContainer = document.getElementById('questions-container');
    const testResults = document.getElementById('test-results');
    const correctAnswersSpan = document.getElementById('correct-answers');
    const totalQuestionsSpan = document.getElementById('total-questions');
    const percentageSpan = document.getElementById('percentage');
    const retryTestBtn = document.getElementById('retry-test-btn');
    const fetchTextBtn = document.getElementById('fetch-text-btn');
    const urlInput = document.getElementById('url-input');
    const urlStatus = document.getElementById('url-status');
    const fileInput = document.getElementById('file-input');
    const fileStatus = document.getElementById('file-status');
    const fileLabel = document.getElementById('file-label');

    let currentTestData = null;

    // ========== Загрузка файлов ==========
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        fileStatus.textContent = "Обработка файла...";
        fileStatus.className = "status-message";

        try {
            // Проверка типа файла
            if (!file.name.match(/\.(txt|docx)$/i)) {
                throw new Error("Поддерживаются только .txt и .docx файлы");
            }

            // Проверка размера (не более 5MB)
            if (file.size > 5 * 1024 * 1024) {
                throw new Error("Файл слишком большой (макс. 5MB)");
            }

            let text;

            // Обработка TXT
            if (file.name.endsWith('.txt')) {
                text = await file.text();
            }
            // Обработка DOCX
            else {
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                text = result.value;

                // Удаляем лишние пробелы и переносы
                text = text.replace(/\s+/g, ' ').trim();
            }

            // Проверка что файл не пустой
            if (!text || text.length < 10) {
                throw new Error("Файл не содержит текста или он слишком короткий");
            }

            // Вставляем текст в поле ввода
            inputText.value = text;
            fileLabel.textContent = file.name;
            fileStatus.textContent = "Файл успешно загружен";
            fileStatus.className = "status-message success";

        } catch (error) {
            console.error("Ошибка загрузки файла:", error);
            fileInput.value = "";
            fileStatus.textContent = error.message;
            fileStatus.className = "status-message error";
            fileLabel.textContent = "Выберите файл (.txt, .docx)";
        }
    });

    // ========== Загрузка по URL ==========
    fetchTextBtn.addEventListener('click', async () => {
        const url = urlInput.value.trim();
        if (!url) {
            urlStatus.textContent = "Введите URL сайта";
            urlStatus.className = "status-message error";
            return;
        }

        // Проверка валидности URL
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            urlStatus.textContent = "URL должен начинаться с http:// или https://";
            urlStatus.className = "status-message error";
            return;
        }

        fetchTextBtn.disabled = true;
        urlStatus.textContent = "Загрузка текста...";
        urlStatus.className = "status-message";

        try {
            const response = await fetch(`/api/fetch-text?url=${encodeURIComponent(url)}`);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || "Ошибка загрузки текста");
            }

            const data = await response.json();

            if (!data.text || data.text.trim().length < 10) {
                throw new Error("Не удалось получить текст с этой страницы");
            }

            inputText.value = data.text;
            urlStatus.textContent = "Текст успешно загружен";
            urlStatus.className = "status-message success";

        } catch (error) {
            console.error("Ошибка загрузки URL:", error);
            urlStatus.textContent = error.message;
            urlStatus.className = "status-message error";
        } finally {
            fetchTextBtn.disabled = false;
        }
    });

    // ========== Генерация теста ==========
    generateBtn.addEventListener('click', async () => {
        const text = inputText.value.trim();
        if (!text) {
            alert("Пожалуйста, введите текст для генерации теста");
            return;
        }

        generateBtn.disabled = true;
        generateBtn.textContent = "Генерация...";

        try {
            const response = await fetch('/api/generate-test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || "Ошибка генерации теста");
            }

            currentTestData = await response.json();
            outputText.value = formatTestAsText(currentTestData);
            displayTestPreview(currentTestData);

        } catch (error) {
            console.error("Ошибка генерации теста:", error);
            alert(`Ошибка: ${error.message}`);
        } finally {
            generateBtn.disabled = false;
            generateBtn.textContent = "Создать тест";
        }
    });

    // ========== Вспомогательные функции ==========
    function formatTestAsText(testData) {
        let result = `Название теста: ${testData.name || 'Без названия'}\n\n`;

        testData.questions.forEach((question, index) => {
            result += `Вопрос ${index + 1}: ${question.question || 'Без текста'}\n`;

            question.options.forEach((option, optIndex) => {
                result += `  ${optIndex + 1}. ${option.answer || 'Без текста'}\n`;
            });

            result += '\n';
        });

        return result;
    }

    function displayTestPreview(testData) {
        try {
            testPreview.classList.remove('hidden');
            testResults.classList.add('hidden');
            testTitle.textContent = testData.name || 'Тест без названия';
            questionsContainer.innerHTML = '';

            if (!testData.questions || !Array.isArray(testData.questions)) {
                throw new Error("Тест не содержит вопросов");
            }

            testData.questions.forEach((question, qIndex) => {
                const questionEl = document.createElement('div');
                questionEl.className = 'question';
                questionEl.dataset.questionIndex = qIndex;

                const questionText = document.createElement('div');
                questionText.className = 'question-text';
                questionText.textContent = `${qIndex + 1}. ${question.question || 'Без текста'}`;
                questionEl.appendChild(questionText);

                const optionsList = document.createElement('div');
                optionsList.className = 'options-list';

                question.options.forEach((option, oIndex) => {
                    const optionContainer = document.createElement('div');
                    optionContainer.className = 'option-container';

                    const radio = document.createElement('input');
                    radio.type = 'radio';
                    radio.name = `question-${qIndex}`;
                    radio.id = `option-${qIndex}-${oIndex}`;
                    radio.value = oIndex;

                    const label = document.createElement('label');
                    label.htmlFor = `option-${qIndex}-${oIndex}`;
                    label.textContent = option.answer || 'Без текста';

                    optionContainer.appendChild(radio);
                    optionContainer.appendChild(label);
                    optionsList.appendChild(optionContainer);
                });

                questionEl.appendChild(optionsList);
                questionsContainer.appendChild(questionEl);
            });

            // Кнопка проверки результатов
            const checkBtn = document.createElement('button');
            checkBtn.className = 'big-button';
            checkBtn.textContent = 'Проверить ответы';
            checkBtn.addEventListener('click', checkAnswers);
            questionsContainer.appendChild(checkBtn);

        } catch (error) {
            console.error("Ошибка отображения теста:", error);
            questionsContainer.innerHTML = `
                <div class="error-message">
                    Ошибка: ${error.message}
                </div>
            `;
        }
    }

    function checkAnswers() {
        let correctCount = 0;
        const questions = currentTestData.questions;

        questions.forEach((question, qIndex) => {
            const selectedOption = document.querySelector(
                `input[name="question-${qIndex}"]:checked`
            );

            const options = document.querySelectorAll(
                `.question[data-question-index="${qIndex}"] .option-container`
            );

            options.forEach((option, oIndex) => {
                // Сброс стилей
                option.classList.remove('correct-answer', 'wrong-answer');

                // Подсветка правильного ответа
                if (question.options[oIndex].correct) {
                    option.classList.add('correct-answer');
                }
            });

            // Проверка выбранного ответа
            if (selectedOption) {
                const selectedIndex = parseInt(selectedOption.value);
                if (question.options[selectedIndex].correct) {
                    correctCount++;
                } else {
                    // Подсветка неправильного ответа
                    options[selectedIndex].classList.add('wrong-answer');
                }
            }
        });

        // Показ результатов
        correctAnswersSpan.textContent = correctCount;
        totalQuestionsSpan.textContent = questions.length;
        percentageSpan.textContent = Math.round((correctCount / questions.length) * 100);
        testResults.classList.remove('hidden');
    }

    // ========== Другие обработчики ==========
    copyBtn.addEventListener('click', () => {
        outputText.select();
        document.execCommand('copy');
        alert('Тест скопирован в буфер обмена');
    });

    pdfBtn.addEventListener('click', async () => {
        if (!currentTestData) {
            alert('Сначала сгенерируйте тест');
            return;
        }

        try {
            const response = await fetch('/api/generate-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(currentTestData),
            });

            if (!response.ok) {
                throw new Error('Ошибка генерации PDF');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'test.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Ошибка при создании PDF');
        }
    });

    wordBtn.addEventListener('click', async () => {
        if (!currentTestData) {
            alert('Сначала сгенерируйте тест');
            return;
        }

        try {
            const response = await fetch('/api/generate-word', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(currentTestData),
            });

            if (!response.ok) {
                throw new Error('Ошибка генерации Word');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'test.docx';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Ошибка при создании Word документа');
        }
    });

    retryTestBtn.addEventListener('click', () => {
        displayTestPreview(currentTestData);
    });
});