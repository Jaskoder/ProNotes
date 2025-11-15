import { createElement } from "./core/Element.js";
import { createComponent } from "./core/Component.js";
import { applyTextStyle } from "./helpers/helpers.js";
import { applyStyleBasedOnClass} from "./helpers/helpers.js";
import { Note } from "./helpers/note.js";
import { insertNote } from "./helpers/helpers.js";
import { fetchNotes } from "./helpers/helpers.js";
import { deleteNote } from "./helpers/helpers.js";
import { formatDate } from "./helpers/helpers.js";
import { saveTheme } from "./helpers/helpers.js";

const navBar = document.querySelector('.nav-bar');
const toggleButton = document.querySelector('#toggle');
const appElement = document.querySelector('.app');
const mainView = document.querySelector('.view .main');
const listWrapper = document.querySelector('.list-wrapper');
const toggleModebutton = document.querySelector('#theme-btn');
const addButton = document.querySelector('#addbtn');
const navBarLinks = document.querySelectorAll('.nav-bar ul li')

let EDITOR;
let TOOLBAR;

function createEditor(note) {
    const editor = createElement('div').classList('editor');
    const editorTextView = createElement('div').classList('text-view');
    const editorTitleWrapper = createElement('div').innerHTML(`<p contenteditable></p>`).classList('title');
    const editorContentWrapper = createElement('div').innerHTML(`<p contenteditable></p>`).classList('content');
    const editorToolBar = TOOLBAR ? TOOLBAR : createToolBar(note);

    const editorTextViewComponent = createComponent(editorTextView, [editorTitleWrapper, editorContentWrapper])
    const editorComponent = createComponent(
        editor,
        [editorTextViewComponent, editorToolBar]
    );

    EDITOR = editorComponent;
    return editorComponent;

}

function createToolBar(note) {
    const toolbar = createElement('div').classList('toolbar');
    const textStylesButtons = ['Bold', 'Italic', 'Underline'].map((label) => {
        const button = (
            createElement('button')
                .click(() => applyTextStyle(label.toLowerCase()))
                .innerHTML(`<span class="icon">${label[0]}</span><span class="tool-tip">${label}</span>`)
        );

        return button;
    });

    const textColorButtons = ['Red', 'Green', 'Blue', 'White', 'Black'].map((label) => {
        const button = (
            createElement('button')
            .id(label.toLowerCase())
            .click( () => applyStyleBasedOnClass(label.toLowerCase()))
            .innerHTML(
                `<span class="icon">${label[0].toUpperCase()}</span>
                 <span class="tool-tip">${label}</span>`
            )
        );
        return button;
    });

    const textCaseButtons = ['Aa', 'aa', 'AA'].map((label) => {

        const tooltiptext = label === 'Aa' ? 'Uppercase' : label === 'aa' ? 'Lowercase' : 'Capitalise';
        const button = (
            createElement('button')
            .id(label)
            .click( () => applyStyleBasedOnClass(label))
            .innerHTML(`
                <span class="icon">${label}</span>
                <span class="tool-tip">${tooltiptext}</span>
            `)
        );
        return button;
    })

    const saveButton = (
        createElement('button')
            .id('save')
            .click(async () => {
                let noteClone = note;
                const { title, content } = resolveTitleAndContent();
                if (noteClone.id) {
                    noteClone.lastOpen = Date.now();
                    noteClone.title = title;
                    noteClone.content = content;
                } else {
                    noteClone = new Note(title, content);
                }

                try {
                    await insertNote(noteClone);
                    await renderSavedNotesList();
                    createAlertBox('Note saved successfully', 'success')
                } catch (e) {
                    console.error(e);
                    createAlertBox('Error saving note')
                }
            })
            .innerHTML(`<span class="icon"><i class="bi bi-save"></i></span><span class="tool-tip">Save</span>`)
    );
    const closeButton = (
        createElement('button')
            .id('close')
            .innerHTML(`<span class="icon"><i class="bi bi-x"></i></span><span class="tool-tip">Close</span>`)
            .click(closeEditor)
    );

    const toolBarComponent = createComponent(toolbar, [...textStylesButtons, ...textColorButtons, ...textCaseButtons, saveButton, closeButton]);
    TOOLBAR = toolBarComponent;
    return toolBarComponent;
}

function createPromptBox(message, callback) {
    let promptBoxComponent;
    const promptBox = createElement('div').classList('prompt');
    const promptMessage = createElement('span').classList('message').innerHTML(message);
    const onYesButton = createElement('button')
        .innerHTML('Confirm')
        .id('true')
        .click(
            () => {
                callback(true);
                if (promptBoxComponent) {
                    appElement.removeChild(promptBoxComponent);
                }
            }
        )
    const onCancelButton = createElement('button')
        .innerHTML('Cancel')
        .id('false')
        .click(
            () => {
                callback(false);
                if (promptBoxComponent) {
                    appElement.removeChild(promptBoxComponent)
                }
            }
        );

    promptBoxComponent = createComponent(
        promptBox,
        [
            promptMessage,
            createComponent(
                createElement('div').classList('btns'),
                [onCancelButton, onYesButton]
            )
        ]
    );

    appElement.appendChild(promptBoxComponent)
}

function createAlertBox(message, type='info') {
    const alertbox = createElement('div').classList(['alert', type]);
    const icon = createElement('span').classList('icon').innerHTML(`<i class="bi bi-exclamation"></i>`);
    const msg = createElement('span').classList('message').innerHTML(message);
    const alertboxComponent = createComponent(alertbox, [icon, msg]);

    appElement.appendChild(alertboxComponent);

    setTimeout(() => appElement.removeChild(alertboxComponent), 3000);
}

function initEditor(note = {}) {
    const editor = EDITOR ? EDITOR : createEditor(note);
    const titleElement = editor.querySelector('.title p');
    const contentElement = editor.querySelector('.content p');

    titleElement.textContent = note?.title || 'Title';
    contentElement.innerHTML = note?.content || 'Start tying';

    mainView.appendChild(editor);
}

async function renderSavedNotesList() {
    const allNotes = await fetchNotes()
    const listElement = createElement('div').classList('list');
    const listItems = [];

    if (allNotes.length > 0) {
        allNotes.forEach((note) => {
            const listItem = createElement('div').classList('list-item');
            const label = createElement('div').classList('label');
            const dataElement = createElement('div').classList('data');
            const actionBtns = createElement('div').classList('actions');
            const editButton = (
                createElement('button')
                    .classList('edit')
                    .innerHTML(`<i class="bi bi-pen"></i>`)
                    .click(() => initEditor(note))
            );

            const deleteButton = (
                createElement('button')
                    .classList('delete')
                    .innerHTML(`<i class="bi bi-trash"></i>`)
                    .click(() => {
                        createPromptBox(`Are you sure to delete "${note.title}"`, async (choice) => {
                            if (choice) {
                                try {
                                    await deleteNote(note.id);
                                    await renderSavedNotesList();
                                    createAlertBox("Note deleted successfully", 'success');
                                } catch (error) {
                                    createAlertBox("An eror occured")
                                    console.error(error);
                                }
                            }
                        })
                    })
            )

            label.innerHTML(`<i class="bi bi-book"></i>`);
            dataElement.innerHTML(`
                <span class="title">${note.title}</span>
                <span class="time">${formatDate(note.lastOpen)}</span>
            `);

            const actionBtnsComponent = createComponent(actionBtns, [editButton, deleteButton]);
            const listItemComponent = createComponent(
                listItem,
                [label, dataElement, actionBtnsComponent]
            );

            listItems.push( listItemComponent)
        });

        listWrapper.innerHTML = '';
        listWrapper.appendChild(
            createComponent(listElement, listItems)
        )
    } else {
        listWrapper.innerHTML = `<span> You haven't saved any note for the moment</span>`
    }
}

function resolveTitleAndContent() {
    const editor = document.querySelector('.editor');
    if (editor) {
        const title = editor.querySelector('.title p').textContent;
        const content = editor.querySelector('.content p').innerHTML;

        return { title, content }
    }
}

function closeEditor() {
    const hasEditor = mainView.querySelector('.editor') !== null;
    if (EDITOR && hasEditor) {
        createPromptBox("You are about to close editor unsaved work would get lost", (choice) => {
            if (choice) {
                mainView.removeChild(EDITOR);
            }
        });
    }
}

function toggleNavBar() {
    navBar.classList.toggle('open')
}

function toogleColorMode() {
    const isLightMode = appElement.classList.contains('light-mode');
    if (isLightMode) {
        appElement.classList.remove('light-mode');
        appElement.classList.add('dark-mode')
        toggleModebutton.innerHTML = `<i class="bi bi-sun-fill"></i><span class="tool-tip">Light-Mode</span>`;
        saveTheme('dark-mode')
    } else {
        appElement.classList.remove('dark-mode');
        appElement.classList.add('light-mode')
        toggleModebutton.innerHTML = `<i class="bi bi-moon-fill"></i><span class="tool-tip">Dark-Mode</span>`;
        saveTheme('light-mode');
    }
}

function applySavedTheme() {
    const theme = localStorage.getItem('pro_note_user_theme') || 'light-mode';
    appElement.classList.add(theme);
}

window.addEventListener('DOMContentLoaded', () => {
    addButton.addEventListener('click', initEditor);
    toggleButton.addEventListener('click', toggleNavBar);
    toggleModebutton.addEventListener('click', toogleColorMode);
    navBarLinks.forEach((l) => {
        l.addEventListener('click', () => {
            createAlertBox("These functionality will be added soon")
        })
    })
    applySavedTheme()
    initEditor()
    renderSavedNotesList();
})