# polling-js

Polling is a method where we check for fresh data over a given interval by periodically making API requests to a server.  
This repo aims to implement an abortable version of polling in JavaScript.  

The polling implemented in this repo works for both node and js-dom environment. 
If you plan to use it in node, please make sure to use node >= 7.6 because the 
implementation relies on async/await. 
