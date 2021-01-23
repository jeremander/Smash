function setCharBtnState(btn, pressed) {
  if (pressed) {
    btn.css("filter", "brightness(55%) opacity(67%)");
    btn.css("transform", "translate(1px, 1px)");
    btn.data("pressed", true);
  }
  else {
    btn.css("filter", "");
    btn.css("transform", "");
    btn.data("pressed", false);
  }
}

function setupGame(game) {
  let menu = $("#roster-menu select");
  $.ajax({
    url: 'games/games.json',
    dataType: 'json',
    async: false,
    success: function (data) {
      let game_data = data[game]
      let names = game_data["rosters"];
      names.reverse();
      names.forEach(function(name) {
        let elt = $('<option value="' + name + '">' + name + '</option>');
        menu.prepend(elt);
      });
      let credits = game_data["credits"];
      $("#icon-credits").html("Icon credits: " + credits);
    }
  });
}

class Roster {

  init(game, dist, char_weights, no_repeats = false) {
    this.game = game;
    this.dist = dist;
    this.char_weights = char_weights;
    this.chars = [];
    this.weights = [];
    for (const [char, wt] of Object.entries(char_weights)) {
      this.chars.push(char);
      this.weights.push(wt);
    }
    this._initWeights();
    this.setNoRepeats(no_repeats);
  }

  // initialize the cumulative weights for randomization
  _initWeights() {
    let ctr = 0;
    this.cumWeights = [];
    for (const wt of this.weights) {
      ctr += Math.max(0, wt);  // only count nonnegative weights
      this.cumWeights.push(ctr);
    }
    this.total = ctr;
    // console.log(this.char_weights);
    // console.log(this.cumWeights);
  }

  // get the number of playable characters
  numPlayable() {
    let ctr = 0;
    for (const wt of this.weights) {
      if (wt > 0) {
        ctr += 1;
      }
    }
    if (ctr == 0) {  // all are playable
      return this.chars.length;
    }
    return ctr;
  }

  // set the weight of character i
  setWeight(i, wt) {
    let char = this.chars[i];
    this.char_weights[char] = wt;
    this.weights[i] = wt;
    this._initWeights();
  }

  // set the no_repeats flag
  setNoRepeats(no_repeats) {
    this.no_repeats = no_repeats
    // set the check status
    $("#no-repeat-check").prop("checked", no_repeats);
    // if only using one character, deactivate the checkbox
    $("#no-repeat-check").attr("disabled", this.numPlayable() == 1);
    localStorage.setItem("no-repeats", no_repeats.toString());
  }

  // return true if the no_repeats = false or only one character is playable
  allowRepeats() {
    return (!this.no_repeats || (this.numPlayable() == 1));
  }

  // caches character data in local storage
  cacheCharacters() {
    let rosterStr = JSON.stringify(this);
    localStorage.setItem(this.game + "-roster", rosterStr);
    let dist = localStorage.getItem("roster-dist");
    if (dist == "Custom") {
      // save the default roster as Custom
      localStorage.setItem(this.game + "-default-roster", rosterStr);
    }
  }

  // handle event of decrementing/incrementing character frequency
  _changeFreq(e, func, cond, cls) {
    e.preventDefault();
    let btn = $(e.target).closest("div").find(".btn");
    btn.addClass("disabled");
    let row = $(e.target).closest(".char-ctl");
    let i = parseInt(row.attr("id").split("-")[1]);
    let freqLbl = row.find(".freq");
    let weight = this.weights[i];
    let freq = (weight >= 0) ? weight : -(weight + 1);
    let newFreq = func(freq);
    let newWeight = (weight >= 0) ? newFreq : -(newFreq + 1);
    freqLbl.text(newFreq);
    this.setWeight(i, newWeight);
    // should always enable the other button
    row.find(cls).removeClass("disabled");
    // may need to change allowability of repeats if only one character is now playable
    this.setNoRepeats(this.no_repeats);
    this.cacheCharacters();
    if (!cond(newFreq)) {  // reactivate button if disable condition is not met
      btn.removeClass("disabled");
    }
  }

  _toggleChar(e) {
    e.preventDefault();
    let row = $(e.target).closest(".char-ctl");
    let i = parseInt(row.attr("id").split("-")[1]);
    let weight = this.weights[i];
    this.setWeight(i, -(weight + 1));  // transform weight to toggle active status
    // may need to change allowability of repeats if only one character is now playable
    this.setNoRepeats(this.no_repeats);
    this.cacheCharacters();
    setCharBtnState($(e.target).closest(".char-icon-btn"), weight >= 0);
  }

  // initialize DOM elements associated with the character set
  initElements() {

    $("#char-list").empty();
    for (let i = 0; i < this.chars.length; i++) {
      let char = this.chars[i];
      let weight = this.weights[i];
      let row = $("<div class='grid-container btn-group char-ctl' id='char-" + i.toString() + "'></div>");
      let charIconBtn = $("<button>", {class: "btn-push char-icon-btn"});
      let charIcon = $("<img>", { class: "char-icon", src: this.imgUrl(char), align: "middle" });
      charIconBtn.append(charIcon);
      setCharBtnState(charIconBtn, weight < 0);  // inactive if weight is negative
      let decrBtn = $("<div><a ontouchstart='' class='btn btn-secondary btn-push freq-ctl decr' href='#'><b>&#8211;</b></a></div>");
      let freq = (weight >= 0) ? weight : -(weight + 1);
      let freqLbl = $("<div><label class='freq'>" + freq.toString() + "</label></div>");
      let incrBtn = $("<div><a class='btn btn-secondary btn-push freq-ctl incr' href='#'><b>+</b></a></div>");
      row.append(charIconBtn, decrBtn, freqLbl, incrBtn);
      // deactivate buttons, if necessary
      if (freq <= 0) {
        row.find(".decr").addClass("disabled");
      }
      else if (freq >= 10) {
        row.find(".incr").addClass("disabled");
      }
      $("#char-list").append(row);
    }

    // handle clicks of character icons
    $(".char-icon-btn").click(function(e) {
      roster._toggleChar(e);
    });

    // handle clicks of decrement/increment buttons

    $(".decr").click(function(e) {
      roster._changeFreq(e, x => x - 1, x => x <= 0, ".incr");
    });

    $(".incr").click(function(e) {
      roster._changeFreq(e, x => x + 1, x => x >= 10, ".decr");
    });
  }

  // random character as a string
  random() {
    let curChar = $("#char-name").text();
    let numPlayable = this.numPlayable();
    let repeatsAllowed = this.allowRepeats();
    var char;
    if ((numPlayable == 1) || ((numPlayable == 2) && !repeatsAllowed)) {
      // only one choice is possible
      for(let i = 0; i < this.chars.length; i++) {
        if (this.weights[i] > 0) {
          char = this.chars[i];
          if (repeatsAllowed || (char != curChar)) {
            return char;
          }
        }
      }
    }
    while (true) {
      if (this.total == 0) {
        // degenerate case: all zero weights (generate uniformly at random)
        let i = Math.floor(Math.random() * this.chars.length);
        char = this.chars[i];
      }
      // "usual" case: generate random integer
      let r = Math.floor(Math.random() * this.total);
      for (let i = 0; i < this.chars.length; i++) {
        if (r < this.cumWeights[i]) {
          char = this.chars[i];
          break;
        }
      }
      if (repeatsAllowed || (char != curChar)) {
        return char;
      }
      // otherwise keep looping until we don't generate a repeat
    }
  }

  // image URL for a given character
  imgUrl(char) {
    return "games/" + this.game + "/img/" + char + ".png";
  }

  // "Random" button pressed
  randomPressed(e) {
    // select a random character
    let char = this.random();
    // change the character text
    $("#char-name").text(char);
    // set the image URL
    $("#char-img").attr("src", this.imgUrl(char));
  }
}

// global character data
var roster = new Roster();

// load character data, initialize page
function loadCharacters(game, force = false) {
  let dist = localStorage.getItem("roster-dist");
  if (dist === null) {
    dist = "Default";
  }
  $("#roster-menu select").val(dist).prop("selected", true);
  let value = null;
  if (dist == "Custom") {
    // retrieve data from roster last saved as Custom
    value = localStorage.getItem(game + "-default-roster");
    force = false;
    if (value === null) {
      // no Custom roster exists, so initialize it to Default
      dist = "Default";
    }
  }
  if (value === null) {
    // try to load roster from cache
    value = localStorage.getItem(game + "-roster");
  }
  let no_repeats = localStorage.getItem("no-repeats") == "true";
  if (force || (value === null)) {
    // load data from JSON
    $.ajax({
      url: 'games/' + game + "/rosters/" + dist + ".json",
      dataType: 'json',
      async: false,
      success: function (data) {
        roster.init(data.game, dist, data.char_weights, no_repeats);
      }
    });
    roster.cacheCharacters();
  }
  else {
    // load data from cache
    let obj = JSON.parse(value);
    roster.init(obj.game, obj.dist, obj.char_weights, no_repeats);
  }
  roster.initElements();
}