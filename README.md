istar
=====

[istar] is a SaaS (Software as a Service) platform for [idock] and [igrep].


Architecture
------------

![istar architecture](https://github.com/HongjianLi/istar/raw/master/public/architecture.png)


Features
--------

### Web client

* [Twitter Bootstrap] v2.1.1
* [HTML5 Boilerplate] v4.0.0
* [Modernizr] v2.6.2
* [jQuery] v1.8.2
* [jQuery UI] v1.9.0

### Web server

* [node.js] v0.8.14
* [mongodb] v1.1.1
* [express] v3.0.1
* [validator] v0.4.13
* [spdy] v1.3.5

### Database

* [MongoDB] v2.2.0

### Workstations

* Intel Xeon E5620 @ 2.40 GHz
* 8GB DDR3 SDRAM
* Fedora 17 x86_64
* Customized [idock] v2.0


Supported browsers
------------------

* Google Chrome 19+
* Mozilla Firefox 12+
* Microsoft Internet Explorer 9+
* Apple Safari 5+
* Opera 12+


RESTful API for idock
---------------------

### Submit a new job via HTTP POST

    curl -d $'email=Jacky@cuhk.edu.hk&receptor=
    ATOM      1  N   ASN A  21      63.845  98.298   0.035  1.00113.44    -0.066 N \n
    ATOM      2  HN1 ASN A  21      64.058  99.036  -0.636  1.00  0.00     0.275 HD\n
    TER    5500      VAL A 552 &
    center_x=1.234&center_y=5.678&center_z=9.012&
    size_x=20&size_y=18&size_z=22&
    description=Screen drug-like ligands for HIV RT&
    email=Jacky@cuhk.edu.hk&
    mwt_lb=400&mwt_ub=500&logp_lb=0&logp_ub=5&nrb_lb=2&nrb_ub=8&
    hbd_lb=2&hbd_ub=5&hba_lb=2&hba_ub=10&charge_lb=0&charge_ub=0&
    ad_lb=0&ad_ub=12&pd_lb=-50&pd_ub=0&tpsa_lb=20&tpsa_ub=100'
    http://istar.cse.cuhk.edu.hk/idock/jobs

### Obtain existing jobs via HTTP GET

    curl -Gd 'email=Jacky@cuhk.edu.hk' http://istar.cse.cuhk.edu.hk/idock/jobs

### Count the number of ligands satisfying your custom filtering conditions via HTTP GET

    curl -Gd
    mwt_lb=400&mwt_ub=500&logp_lb=0&logp_ub=5&nrb_lb=2&nrb_ub=8&
    hbd_lb=2&hbd_ub=5&hba_lb=2&hba_ub=10&charge_lb=0&charge_ub=0&
    ad_lb=0&ad_ub=12&pd_lb=-50&pd_ub=0&tpsa_lb=20&tpsa_ub=100
    http://istar.cse.cuhk.edu.hk/idock/ligands


RESTful API for igrep
---------------------

### Submit a new job via HTTP POST

    curl -d $'email=Jacky@cuhk.edu.hk&taxid=9606&queries=CTGCATGGTGGGGAAAAGGCATAGCCTGGG3
    AAAAGTGTTATGGGTTGTTTAATCAACCACTGAACTGCGGGGGTGACTAGTTATAACTTA6'
    http://istar.cse.cuhk.edu.hk/igrep/jobs

### Obtain existing jobs via HTTP GET

    curl -Gd 'email=Jacky@cuhk.edu.hk' http://istar.cse.cuhk.edu.hk/igrep/jobs


Licenses
--------

* Code licensed under [Apache License 2.0].
* Documentation licensed under [CC BY 3.0].


Author
--------------

[Jacky Lee]


Logo
----

![istar logo](https://github.com/HongjianLi/istar/raw/master/logo.png)



[istar]: http://istar.cse.cuhk.edu.hk
[idock]: http://idock.cse.cuhk.edu.hk
[igrep]: http://igrep.cse.cuhk.edu.hk
[Twitter Bootstrap]: https://github.com/twitter/bootstrap
[HTML5 Boilerplate]: https://github.com/h5bp/html5-boilerplate
[Modernizr]: https://github.com/Modernizr/Modernizr
[jQuery]: https://github.com/jquery/jquery
[jQuery UI]: https://github.com/jquery/jquery-ui
[node.js]: https://github.com/joyent/node
[mongodb]: https://github.com/mongodb/node-mongodb-native
[express]: https://github.com/visionmedia/express
[validator]: https://github.com/chriso/node-validator
[spdy]: https://github.com/indutny/node-spdy
[MongoDB]: https://github.com/mongodb/mongo
[Apache License 2.0]: http://www.apache.org/licenses/LICENSE-2.0
[CC BY 3.0]: http://creativecommons.org/licenses/by/3.0
[Jacky Lee]: http://www.cse.cuhk.edu.hk/~hjli
