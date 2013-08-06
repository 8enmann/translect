function submit() {
 define($('#query').val());
}

$('#activate').click(function(event) {
  chrome.tabs.executeScript(null, {file: 'jquery.min.js'});
  chrome.tabs.insertCSS(null, {file: 'translect.css'});
  chrome.tabs.executeScript(null, {file: 'translect.js'});
  console.log('injection complete');
});

$('#submit').click(function(event) {
  submit();
}); 

$('#query').keypress(function(event) {
  if (event.which == 13) {
    submit();
  }
});

function print(text) {
  var $div = $('<div></div>').prependTo('#console');
  $div.html(text);
}
/*
 * Sample input:
 * {{T|en}} : {{trad+|en|good morning}} (le matin), {{trad+|en|good afternoon}} (l'après-midi), {{trad+|en|hello}} {{informel|nocat=1}}, {{trad+|en|good day}}
 */
function clean(text) {
  var result;
  var word = /en\|(.*?)\}\}(.*?)(?:{|$)/.exec(text);
  if (word != null) {
    result = word[1];
    if (word.length > 2) {
      result += word[2];
    }
  } else {
    // Parsing failed.
    return text;
  }
  var qualifier = /([^\{]*?)\|nocat=1\}\}/.exec(text);
  if (qualifier != null) {
    result += '<i>(' + qualifier[1] + ')</i>'
  }
  return result;
}

function define(query) {
  query = query.toLowerCase();
  var url = "https://fr.wiktionary.org/w/api.php?format=json&action=query&titles=" + query + "&rvprop=content&prop=revisions&redirects=1";
  $.getJSON(url, null, function(data) {
    var raw;
    for (var page in data.query.pages) { 
      raw = data.query.pages[page].revisions[0]['*'];
    }
    print('<b>== ' + query + ' ==</b>');
    console.log(raw);
    var findTargetMode = false;
    $.each(raw.split('\n'), function(i, elem) {
      if (/(?:-flex-nom-|-flex-adj-)/.test(elem)) {
        findTargetMode = true;
      }
      if (findTargetMode) {
        var nounForm = /\[\[(.*?)\]\]/.exec(elem);
        if (nounForm != null && nounForm[1] != query) {
          findTargetMode = false;
          define(nounForm[1]);
        }
      }
      var verbForm = /fr-verbe-flexion\|(.*?)\|/.exec(elem);
      if (verbForm != null && verbForm[1] != query) {
        define(verbForm[1]);
      }
      var translations = /^\{\{T|en(?:\|trier)?\}\} : (.*?)$/.exec(elem);
      if (translations != null) {
        $.each(translations[1].split(','), function(j, word) {
          print(clean(word));
        });
      }
    });
  });
}

var getSelected = function(){
  var t = '';
  if(window.getSelection){
    t = window.getSelection().toString();
  }else if(document.getSelection){
    t = document.getSelection().toString();
  }else if(document.selection){
    t = document.selection.createRange().text;
  }
  return t;
}

$(document).ready(function() {
var $div = $('<div id="console"></div>').prependTo('body');
$div.html("Translations");
$(document).bind("mouseup", mouseup);
console.log('mousup');
});

var mouseup = function(){
  console.log('inside');
  var st = getSelected();
  if(st!=''){
    console.log(st);
    define(st);
  }
}