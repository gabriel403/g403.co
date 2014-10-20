##Personal Statment

I am an open source software developer/systems administrator, who works equally on the backend, PHP (ZF2, Apigility, Symfony, homegrown), RoR as both APIs and full stack frameworks and the frontend jQuery, AngularJS, Bootstrap, Dojo Toolkit. I also have extensive experience of provisioning/managing servers with puppet and packer.

I am currently systems developer for Fusions PIM, a system for managing product enrichment lifecycle. I manage multiple servers for hosting the various enviroments as well as day to day PHP development as part of the development team. I write multiple one off apps to automate and simplify routine tasks, including a RoR application for updating the on-call support member and a Rails API/AngularJS deployment platform. I also maintain the server instances and development VMs using a series of puppet scripts (puppet forge and home grown) and packer.

I'm a passionate open source advocate producing various modules to ease the use of Zend Framework 2, as well as my own website/blog, making use of various open source tools, such as Michelf's PHP Markdown Extra and GitHub for hosting. I blog on various PHP/JS related topics and present talks on various subjects at local user groups.

##Placement Year

During my placement year at university I started as a junior web developer working for Go MAD Thinking, working on iCheev, I quickly became the server administrator handling SVN, access control, testing and live servers as well as deployment.

I also introduced the trac bug tracking system which we've used to track the development process of new features as well tracking bugs from discovery to resolution.

##Post Graduate

###Go MAD Technology

After graduating I went back to working for the same company as web developer/server administrator.
I started working with more languages such as C#.NET and Ruby.

####Jenkins CI

I also worked to integrate our provisional suite of unit tests into a more continuous solution by the introduction of Jenkins CI to routinely run our rapidly increasing suite of unit tests. I then progressed to using Jenkins CI to automate our deployment through the testing stages and finally to the production deploy.

####Git

As a frequent contributor to open source projects, most of them through github I introduced the company to git and championed the use of git as our vcs, finalising with a [presentation](http://slid.es/gabriel403/git-githubgitlab-gitflow/) on git, github and gitflow to the majority of the company upon which the decision was taken to move forward with git. We are now in transition from subversion to git on github.

####boxen

After discovering the wonders of puppet and vagrant (and how github use puppet to set up their local dev machines (I stole the name)) and how well they could be combined I started work on a project to enable our devs to spin up vagrant instances to use as dev servers. I also produced configurable puppet scripts that would reproduce our various development projects, with all server dependencies, with minimal fuss. This allowed rapid deployment of our projects to new nodes as needed. This also freed the devs and allowed them to use any combination of operating system and hardware they wished whilst still running their development on the vagrant boxes which would replicate a common environment. Extra vagrant boxes were generated to enable developers to replicate different environments from our 'edge' development server all the way to production, all on VMs on their local machine. This also lead to new technologies being implemented as puppet scripts allowing easy deployment amongst developers and then on servers, as the puppet scripts don't need to run on a virtual. This also enabled writing puppet scripts to set up brand new or newly reinstalled machines with all the programs a dev needs.

###Fusions PIM

####Vagrant, Puppet and Packer

One of my first jobs when I started working at Fusions was to rebuild the dev vm the company was currently using. Due to time constraints and only being a small company they hadn't had the oppertunity to keep the VM up to date nor to automate an installation with the various provisioning tools available.
During the rebuilding of the VM I made the conscious decision to make the provisioning and future rebuild of the VM as automated as possible, I wanted to spend my time doing development not rebuilding virtual machine images. I'd already had experience of using Puppet and Vagrant at GMT and was able to expand on that significantly when building the fusions VM. I was able to keep the dependencies of the puppet scripts nicely serperated so that they can be reused in other environments. This led on to being able to use an expanded and more configurable set of scripts to set up the more advanced environments, so that our edge, staging, backup and production servers where all buildable using the same set of scripts. I also used the advantages of Packer to further automate the building of these VMs, meaning I'd literally have to run a single command to produce a new up to date virtual machine in any particular environment.

####Prowl

####Soundwave

####DOM

####PHPEM

####PHPCI

I work in my spare to help on the PHPCI project. This is a PHP based continuous integration server, with plugins for various PHP tools, such as PHPUnit, Mess Detector, Code Sniffer, PHP-CS-Fixer and lots more. It works with local and remote respositories, including building on demand and when pushes to github/gitlab happen.