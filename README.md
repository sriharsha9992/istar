istar
=====

[istar] is a software-as-a-service platform for bioinformatics and chemoinformatics.


Architecture
------------

![istar architecture](https://github.com/HongjianLi/istar/raw/master/public/architecture.png)


Components
----------

### Web client

* [Twitter Bootstrap] v2.2.2
* [Modernizr] v2.6.2
* [jQuery] v1.9.0
* [jQuery UI] v1.10.0

### Web server

* [node.js] v0.8.18
* [mongodb] v1.2.11
* [express] v3.1.0
* [validator] v0.4.23
* [spdy] v1.4.4

### Database

* [MongoDB] v2.2.2

### Workstations and daemons

* Intel Xeon E5620 @ 2.40 GHz
* 8GB DDR3 SDRAM
* Fedora 17 x86_64
* [idock] daemon v2.1

* Intel Xeon E5620 @ 2.40 GHz
* 8GB DDR3 SDRAM
* Fedora 17 x86_64
* [idock] daemon v2.1

* Intel Xeon W3520 @ 2.66 GHz
* 8GB DDR3 SDRAM
* NVIDIA GeForce GTX 285 (1024 MB)
* Fedora 17 x86_64
* [igrep] daemon v1.0


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

    curl http://istar.cse.cuhk.edu.hk/idock/jobs

### Count the number of ligands satisfying your custom filtering conditions via HTTP GET

    curl -Gd
    'mwt_lb=400&mwt_ub=500&logp_lb=0&logp_ub=5&nrb_lb=2&nrb_ub=8&
    hbd_lb=2&hbd_ub=5&hba_lb=2&hba_ub=10&charge_lb=0&charge_ub=0&
    ad_lb=0&ad_ub=12&pd_lb=-50&pd_ub=0&tpsa_lb=20&tpsa_ub=100'
    http://istar.cse.cuhk.edu.hk/idock/ligands


RESTful API for igrep
---------------------

### Submit a new job via HTTP POST

    curl -d $'email=Jacky@cuhk.edu.hk&taxid=9606&queries=CTGCATGGTGGGGAAAAGGCATAGCCTGGG3
    AAAAGTGTTATGGGTTGTTTAATCAACCACTGAACTGCGGGGGTGACTAGTTATAACTTA6'
    http://istar.cse.cuhk.edu.hk/igrep/jobs

### Obtain existing jobs via HTTP GET

    curl http://istar.cse.cuhk.edu.hk/igrep/jobs


Licenses
--------

* idock and igrep are licensed under [Apache License 2.0].
* iview is licensed under [GPL 3.0].
* Documentation is licensed under [CC BY 3.0].


Author
--------------

[Jacky Lee]


Logo
----

![istar logo](https://github.com/HongjianLi/istar/raw/master/logo.png)



[istar]: http://istar.cse.cuhk.edu.hk
[idock]: http://istar.cse.cuhk.edu.hk/idock
[igrep]: http://istar.cse.cuhk.edu.hk/igrep
[iview]: http://istar.cse.cuhk.edu.hk/iview
[Twitter Bootstrap]: https://github.com/twitter/bootstrap
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
[GPL 3.0]: http://www.gnu.org/licenses/gpl.html
[CC BY 3.0]: http://creativecommons.org/licenses/by/3.0
[Jacky Lee]: http://www.cse.cuhk.edu.hk/~hjli
