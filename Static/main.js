document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generate-btn');
    const copyBtn = document.getElementById('copy-btn');
    const pdfBtn = document.getElementById('pdf-btn');
    const wordBtn = document.getElementById('word-btn');
    const inputText = document.getElementById('input-text');
    const outputText = document.getElementById('output-text');
    const testPreview = document.getElementById('test-preview');
    const testTitle = document.getElementById('test-title');
    const questionsContainer = document.getElementById('questions-container');

    let currentTestData = null;

    generateBtn.addEventListener('click', async () => {
        const text = inputText.value.trim();
        if (!text) {
            alert('Пожалуйста, введите текст для генерации теста');
            return;
        }

        generateBtn.disabled = true;
        generateBtn.textContent = 'Генерация...';

        try {
            const response = await fetch('/api/generate-test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text }),
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }

            currentTestData = await response.json();
            outputText.value = formatTestAsText(currentTestData); // Изменено здесь
            displayTestPreview(currentTestData);
            testPreview.classList.remove('hidden');
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Произошла ошибка при генерации теста');
        } finally {
            generateBtn.disabled = false;
            generateBtn.textContent = 'Создать тест';
        }
    });

    // Копирование теста
    copyBtn.addEventListener('click', () => {
        if (!outputText.value) {
            alert('Нет данных для копирования');
            return;
        }

        outputText.select();
        document.execCommand('copy');
        alert('Тест скопирован в буфер обмена');
    });

    // Генерация PDF
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
                throw new Error(await response.text());
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'test.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Произошла ошибка при генерации PDF');
        }
    });

    // Генерация Word
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
                throw new Error(await response.text());
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'test.docx';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Произошла ошибка при генерации Word документа');
        }
    });
    function formatTestAsText(testData) {
    let result = `Название теста: ${testData.name}\n\n`;

    testData.questions.forEach((question, index) => {
        result += `${index + 1}. ${question.question}\n`;

        question.options.forEach((option, optIndex) => {
            result += `   ${optIndex + 1}. ${option.answer}\n`;  // Убрано указание правильного ответа
        });

        result += '\n';
    });

    return result;
    }
    // Отображение предпросмотра теста
    function displayTestPreview(testData) {
        testTitle.textContent = testData.name;
        questionsContainer.innerHTML = '';

        testData.questions.forEach((question, qIndex) => {
            const questionElement = document.createElement('div');
            questionElement.className = 'question';

            const questionText = document.createElement('div');
            questionText.className = 'question-text';
            questionText.textContent = `${qIndex + 1}. ${question.question}`;
            questionElement.appendChild(questionText);

            question.options.forEach((option, oIndex) => {
                const optionElement = document.createElement('div');
                optionElement.className = `option ${option.correct ? 'correct' : ''}`;
                optionElement.textContent = `${oIndex + 1}. ${option.answer} ${option.correct ? '(Правильный)' : ''}`;
                questionElement.appendChild(optionElement);
            });

            questionsContainer.appendChild(questionElement);
        });
    }
});