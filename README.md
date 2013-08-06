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

(2013-08-05) This repo is still very much under development. At the moment all it will do is download the IATI XML and parse the unique identifier for each IATI Activity into MongoDB. Support for all IATI fields will be added over the next week.  
	