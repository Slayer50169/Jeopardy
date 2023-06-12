// categories is the main data structure for the app; it looks like this:

//  [
//    { title: "Math",
//      clues: [
//        {question: "2+2", answer: 4, showing: null},
//        {question: "1+1", answer: 2, showing: null}
//        ...
//      ],
//    },
//    { title: "Literature",
//      clues: [
//        {question: "Hamlet Author", answer: "Shakespeare", showing: null},
//        {question: "Bell Jar Author", answer: "Plath", showing: null},
//        ...
//      ],
//    },
//    ...
//  ]

let categories = [];
let clues = [];

/** Get NUM_CATEGORIES random category from API.
 *
 * Returns array of category ids
 */

async function getCategoryIds() {
    let ids = [];
    while(ids.length < 6){
        let category = await axios.get(`http://jservice.io/api/categories?count=1&offset=${Math.floor(Math.random() * 100)}`);
        console.log(category);
        if(category.data[0].clues_count >= 2){
            ids.push(category.data[0].id);
        }
        console.log(ids);
    }
    return ids;
}   

/** Return object with data about a category:
 *
 *  Returns { title: "Math", clues: clue-array }
 *
 * Where clue-array is:
 *   [
 *      {question: "Hamlet Author", answer: "Shakespeare", showing: null},
 *      {question: "Bell Jar Author", answer: "Plath", showing: null},
 *      ...
 *   ]
 */

async function getCategory(catId) {
    let category = await axios.get(`http://jservice.io/api/category?id=${catId}`);
    let result = category.data;
    return result;
}

/** Fill the HTML table#jeopardy with the categories & cells for questions.
 *
 * - The <thead> should be filled w/a <tr>, and a <td> for each category
 * - The <tbody> should be filled w/NUM_QUESTIONS_PER_CAT <tr>s,
 *   each with a question for each category in a <td>
 *   (initally, just show a "?" where the question/answer would go.)
 */

async function fillTable() {
    let $jeopardy = $('#jeopardy');
    let $table = $('<table></table>');
    let $thead = $('<thead><tr></tr></thead>');
    let $tbody = $('<tbody></tbody>');
    let $answer = $(`<tfoot style='display: none;'></tfoot>`)
    $($answer).text('?');
    console.log($thead);
    for(let category of categories){
        let $td = $(`<td catId='${category.id}' style='display: none;'></td>`)
        $td.text(category.title.toUpperCase());
        $($thead).children().append($td);
    }
    let $q1 = $('<tr></tr>');
    let $q2 = $('<tr></tr>');
    let i = -1;
    for(let category of categories){
        let q1 = category.clues[Math.floor(Math.random() * category.clues_count)];
        let q2 = category.clues[Math.floor(Math.random() * category.clues_count)];
        clues.push(q1, q2);
        i++;
        $q1.append($(`<td style='display:none' clueNum=${i}>${q1.question.toUpperCase()}</td>`));
        i++;
        $q2.append($(`<td style='display:none' clueNum=${i}>${q2.question.toUpperCase()}</td>`));
    }
    $tbody.append($q1);
    $tbody.append($q2);
    $table.append($thead);
    $table.append($tbody);
    $table.append($answer);
    $jeopardy.append($table);
    $('[clueNum=0]').css('display','unset');
    $(`[catId=${clues[0].category_id}]`).css('display', 'unset');

}

/** Handle clicking on a clue: show the question or answer.
 *
 * Uses .showing property on clue to determine what to show:
 * - if currently null, show question & set .showing to "question"
 * - if currently "question", show answer & set .showing to "answer"
 * - if currently "answer", ignore click
 * */

function handleClick(evt) {
    console.log(evt)
    if(evt.target.parentNode.parentNode.tagName == "TBODY"){
        if (clues[$(evt.target).attr('clueNum')].showing == null){
            clues[$(evt.target).attr('clueNum')].showing = 'question';
            $('tfoot').css('display', 'unset');
        } else if (clues[$(evt.target).attr('clueNum')].showing == 'question'){
            $('tfoot').html(clues[$(evt.target).attr('clueNum')].answer);
            clues[$(evt.target).attr('clueNum')].showing = 'answer';
        } else if (clues[$(evt.target).attr('clueNum')].showing == 'answer'){
            $('tfoot').html('?').css('display', 'none');
            $(evt.target).remove();
            if(parseInt($(evt.target).attr('clueNum')) % 2 != 0){
                $(`[catId=${clues[$(evt.target).attr('clueNum')].category_id}]`).css('display', 'none');
                if(parseInt($(evt.target).attr('clueNum')) + 1 == clues.length){
                    $('#jeopardy').text('Game Over!!! Press button to restart.');
                } else {
                    $(`[catId=${clues[parseInt($(evt.target).attr('clueNum')) + 1].category_id}]`).css('display', 'block');
                }
            } 
            $(`[clueNum=${parseInt($(evt.target).attr('clueNum')) + 1}]`).css('display', 'block');

        }
    }
}

/** Wipe the current Jeopardy board, show the loading spinner,
 * and update the button used to fetch data.
 */

function showLoadingView() {
    $('#start').css('display', 'none').text('Restart!');
    $('#jeopardy').html('');
    categories = [];
    clues = [];
    $('#spin-container').css('display', 'unset');
}

/** Remove the loading spinner and update the button used to fetch data. */

function hideLoadingView() {
    $('#start').css('display', 'unset');
    $('#spin-container').css('display', 'none');
}

/** Start game:
 *
 * - get random category Ids
 * - get data for each category
 * - create HTML table
 * */

async function setupAndStart() {
    showLoadingView();
    for(let category of await getCategoryIds()){
        categories.push(await getCategory(category));
    }
    console.log(categories);
    fillTable();
    hideLoadingView();
}

/** On click of start / restart button, set up game. */

$("#start").on('click', function(e){
    setupAndStart();
})

/** On page load, add event handler for clicking clues */

$('#jeopardy').on('click', function(evt){
    handleClick(evt);
});