
$(document).ready(function () {

  // enable tooltips globally
  $(function() {
    $('[data-toggle="tooltip"]').tooltip()
  });

  let game = getCurrentGame();

  // lay out game data
  setupGame(game);

  // "Random" button pressed
  $("#random-button").click(function() {
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

  setupGameSelectionModal();

});