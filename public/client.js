$(document).ready(function () {
  /* global io */
  let socket = io();

  // Listen for user count event
  socket.on('user count', function(data) {
    // The value of currentUsers as defined in server.js will show up in CLIENT console
    console.log(data);
  });

  // Form submittion with new message in field with id 'm'
  $('form').submit(function () {
    var messageToSend = $('#m').val();

    $('#m').val('');
    return false; // prevent form submit from refreshing page
  });
});
