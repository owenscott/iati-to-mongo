#IATI to MongoDB

##Overview

A simple program for downloading all of the activity files included in the IATI Registry and parsing them into a MongoDB database. The program is in Node but the database can be accessed from a client in any language once it is populated.

##Installation

1. Download and install NodeJS (http://nodejs.org/download/)

2. Download MongoDB and run the mongod.exe binary (http://www.mongodb.org/downloads)

    ~\mongodb\bin\mongod.exe
	
3. Clone the iatiToMongo repo and install the required Node Modules

    ~\iati-to-mongo> npm install
	
4. Run iatiToMongo.js

    ~\iati-to-mongo> node iatiToMongo.js
		
##Current Status

(2013-09-23) Currently downloads all projects are raw XML parsed to JSON, without further transformation or validation.

(2013-10-07) Switched XMl parsing to use streaming parser (buffering entire files into memory was crashing after USAID uploaded their huge CRS files)