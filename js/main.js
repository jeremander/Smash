const defaultGame = "SSBM";

$(document).ready(function () {

  // enable tooltips globally
  $(function() {
    $('[data-toggle="tooltip"]').tooltip()
  });

  // load game title from cache (default otherwise)
  let game = localStorage.getItem("game-title");
  if (game === null) {
    game = defaultGame;
  }

  // fill in game title
  $(".card-header h2").text(game + " Character");

  // place available rosters in menu
  setupGame(game);

  // load characters
  loadCharacters(game);
  roster.randomPressed();

  // "Random" button pressed
  $("#random").click(function() {
    roster.randomPressed();
  });

  // "No Repeat" checkbox changed
  $("#no-repeat-check").change(function() {
    roster.setNoRepeats(this.checked);
  });

  // roster distribution changed
  $("#roster-menu select").change(function(e) {
    // cache the distribution
    let dist = $(this).children("option:selected").val();
    localStorage.setItem("roster-dist", dist);
    // reload the roster with the chosen distribution
    loadCharacters(game, true);
  });

  // refresh button pressed
  $("#refresh-roster").click(function() {
    // reset the roster with the current distribution
    loadCharacters(game, true)
  });

});