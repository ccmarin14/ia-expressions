const url = "https://gma-n8n.master2000.net"
const phraseContainer = document.querySelector(".phrase-container");
const buttonGenerator = document.querySelector(".buttonGen");
const buttonGenIcon = buttonGenerator.querySelector(".buttonGen__icon");
const modal = document.querySelector(".modal");
const titleModal = modal.querySelector(".translation");
const modalLoading = document.querySelectorAll(".modal-loading");
const modalLoader = document.querySelector(".modal-loader");
const definitionText = document.querySelector(".definition-text");
const updateDefinition = document.querySelector(".update__definition");
const responseLabel = document.querySelector(".response-label");
const responseText = document.querySelector(".response-text");
const updateResponse = document.querySelector(".update__response");
const actionSynonym = document.querySelector(".action__synonym");
const actionPhraseAlternative = document.querySelector(".action__phrase__alternative");
const actionPhraseEquivalent = document.querySelector(".action__phrase__equivalence");
const containerExpression = document.querySelector(".expression");
const responseBefore = document.querySelector(".response__before");
const responseAfter = document.querySelector(".response__after");
let word, expression, responseType, lastAction;
let phraseCurrent = "";

const getPhrase = async () => {
    const path = "/webhook/phrase-generator";
    const auth = "FVoU2qU+7I6qJ74r]P}";

    const topic = document.getElementById('topic').value;
    const level = document.getElementById('level').value;
    const difficulty = document.getElementById('difficulty').value;

    const params = new URLSearchParams();
    params.append("topic", topic || "daily-life-family");
    params.append("level", level || "preschool");
    params.append("difficulty", difficulty || "easy");

    try {
        const response = await fetch(`${url + path}?${params.toString()}`, {
            method: "GET",
            headers: {
                n8n: auth,
            },
        });

        if(!response.ok){
            throw new Error(`Response status: ${response.status}`)
        }

        const phrase = await response.json();
        return phrase.text;
    } catch (error) {
        console.error(error.message);
    }
}

const getTranslate = async (word, expression, response_type) => {
    const path = "/webhook/vocabulary";
    const auth = "5,F0nB8@M9S]a<ri<Fsp";

    const params = new URLSearchParams();
    params.append("word", word);
    params.append("expression", expression);
    params.append("response_type", response_type);

    try {
        const response = await fetch(`${url + path}?${params.toString()}`, {
            method: "GET",
            headers: {
                n8n: auth,
            },
        })
        .then(response => {
            if(!response.ok){
                throw new Error(`Response status: ${response.status}`)
            }
            return response.json()
        });
        
        return response;
    } catch (error) {
        modal.close("");
        console.error(error.message);
    }
}

const mountModal = (word, data) => {
    word = word.replace(/[^a-zA-Z0-9]+$/, '');
    titleModal.innerHTML = `<span class="highlight">"${word}"</span>  :  ${data.translation}`;
    definitionText.textContent = data.definition;
    modalLoader.classList.add("no-display");
    modalLoading.forEach(loading => loading.classList.remove("no-display"));
    containerExpression.innerHTML = `<span><b>Expresión original:</b><div class="expression-text">${this.expression}<div>`;
    actionPhraseAlternative.innerHTML = `Frase con <mark>${word}</mark>`;
}

const cleanModal = () => {
    titleModal.textContent = "";
    definitionText.textContent = "";
    responseLabel.textContent = "";
    responseText.innerHTML = "";
    lastAction = "";
    actionPhraseAlternative.innerHTML = "";
    cleanSelectAction();
    updateResponse.classList.add("no-display");
    responseLabel.innerHTML = "Selecciona una acción para generar texto a partir de la palabra elegida y su expresión";
    modalLoading.forEach(loading => loading.classList.add("no-display"));
    containerExpression.innerHTML = "";
    modalLoader.classList.remove("no-display");
    responseBefore.classList.remove("no-display");
    responseAfter.classList.add("no-display");
}

const loadModal = async (word, expression) => {
    this.word = word;
    this.expression = expression;
    cleanModal();
    modal.showModal();
    let data = await getTranslate(word, expression);
    mountModal(word, data);
}

const updateDefinitionText = async () => {
    updateDefinition.classList.add("icon-loader");
    toggleButtons();
    const data = await getTranslate(this.word, this.expression, "definition");
    if (data) {
        definitionText.textContent = data.definition;
    } else {
        definitionText.textContent = "No se pudo obtener la definición.";
    }
    toggleButtons();
    updateDefinition.classList.remove("icon-loader");
}

const updateResponseValues = async (response_type, event) => {
    if (event) {
        event.classList.add("action__select");
        lastAction = event;
    }

    cleanSelectAction();
    toggleButtons();

    responseBefore.classList.add("no-display");
    updateResponse.classList.add("icon-loader");
    responseAfter.classList.remove("no-display");
    updateResponse.classList.contains("no-display") && updateResponse.classList.remove("no-display");
    responseLabel.innerHTML = "Cargando...";
    responseText.innerHTML = "";
    responseType = response_type;
    const data = await getTranslate(this.word, this.expression, response_type);
    if (data) {
        const build = buildResponseContainer(data, response_type);
        responseLabel.textContent = build.label;
        responseText.innerHTML = build.response;
    } else {
        responseText.textContent = "No se pudo obtener la respuesta.";
    }
    updateResponse.classList.remove("icon-loader");
    toggleButtons();
}

const buildResponseContainer = (data, response_type) => {
    let build = {};

    label = determineLabel(response_type);

    build.label = label;
    switch (response_type) {
        case "equivalences":
        case "synonyms":
            const list = extractList(data);
            build.response = `${list.map(item => `<li>${item}</li>`).join("")}`;
            break;
        case "phrase_alternative":
        case "phrase_equivalent":
            const phrase = extractPhrase(data);
            const highlightedPhrase = highlightWord(phrase.phrase);
            const highlightedTranslation = highlightWord(phrase.translation);
            build.response = `<b>Frase: </b><span>${highlightedPhrase}</span><br><b>Traducción: </b><span>${highlightedTranslation}</span><br>`;
            break;      
        default:
            return "";
    }
    return build;
}

const determineLabel = (response_type) => {
    switch (response_type) {
        case "equivalences":
            return "Equivalencias:";
        case "synonyms":
            return "Sinónimos:";
        case "antonyms":
            return "Antónimos:";
        case "phrase_alternative":
            return "Frase alternativa:";
        case "phrase_equivalent":
            return "Frase equivalente:";
        default:
            return "";
    }
}

const extractList = (data) => {
    if (Array.isArray(data.equivalences)) {
        return data.equivalences;
    }

    if (Array.isArray(data.synonyms)) {
        return data.synonyms;
    }

    // si no coincide con nada, retorna array vacío
    return [];
}

const extractPhrase = (data) => {
    if (Array.isArray(data.phrase_equivalent)) {
        return data.phrase_equivalent[0];
    }

    if (Array.isArray(data.phrase_alternative)) {
        return data.phrase_alternative[0];
    }

    if (data.phrase && data.translation) {
        return { phrase: data.phrase, translation: data.translation };
    }

    // si no coincide con nada, retorna array vacío
    return [];
}

const toggleButtons = () => {
    updateDefinition.classList.toggle("disabled");
    updateResponse.classList.toggle("disabled");
    actionSynonym.classList.toggle("disabled");
    actionPhraseAlternative.classList.toggle("disabled");
    actionPhraseEquivalent.classList.toggle("disabled");
}

const highlightWord = (text) => {
    console.log(text);
    console.log(this.word);
    const regex = new RegExp(`(${this.word})`, 'gi');
    return text.replace(regex, `<span class="light">$1</span>`);
};

const cleanSelectAction = () => {
    document.querySelectorAll(".action").forEach(action => {
        if (action !== lastAction) {
            action.classList.remove("action__select");
        }
    });
}

updateDefinition.addEventListener('click', () => updateDefinitionText());
updateResponse.addEventListener('click', () => updateResponseValues(responseType));
actionSynonym.addEventListener('click', (event) => updateResponseValues("synonyms", event.currentTarget));
actionPhraseAlternative.addEventListener('click', (event) => updateResponseValues("phrase_alternative", event.currentTarget));
actionPhraseEquivalent.addEventListener('click', (event) => updateResponseValues("phrase_equivalent", event.currentTarget));

async function main() {
    buttonGenerator.classList.add("disabled");
    buttonGenIcon.classList.add("icon-loader");
    phraseContainer.innerHTML = "Cargando...";

    const phrase = await getPhrase();
    
    if (!phrase) {
        phraseContainer.textContent = "No se pudo obtener la frase.";
        buttonGenIcon.classList.remove("icon-loader");
        buttonGenerator.classList.remove("disabled");
        return;
    }

    // Almacenar la frase actual
    phraseCurrent = phrase;

    // Quitar punto final si existe
    const cleanPhrase = phrase.endsWith('.') ? phrase.slice(0, -1) : phrase;

    const words = cleanPhrase.split(" ");
    let html = "";

    words.forEach(word => {
        html += `<span class="word">${word}</span> `;
    });

    phraseContainer.innerHTML = html;
    phraseContainer.innerHTML += `<p class="keep">💡 Haz clic en cualquier palabra para ver su definición y ejemplos</p>`;

    document.querySelectorAll('.word').forEach(span => {
        span.addEventListener('click', () => loadModal(span.textContent, phraseCurrent));
    });

    buttonGenIcon.classList.remove("icon-loader");
    buttonGenerator.classList.remove("disabled");
}

main();