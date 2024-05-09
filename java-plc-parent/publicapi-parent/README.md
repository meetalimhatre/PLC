# Product Lifecycle Costing Public API

The [SAP Product Lifecycle Costing](https://www.sap.com/products/product-lifecycle-costing.html) Public API is a [Domain Driven](https://en.wikipedia.org/wiki/Domain-driven_design) [REST](https://en.wikipedia.org/wiki/Representational_state_transfer) [API](https://en.wikipedia.org/wiki/Application_programming_interface) which allows third party integrations with the SAP PLC engine 

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

In order to be able to build and run the code you need to have read acces to the current repo. You also need the following additional software:
* [git client](https://git-scm.com/downloads)
* [maven](https://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html)
* [jdk 8](https://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html)

*Note: As the API is using some SAP internal libraries, building the jar file requires access to the internal nexus server in SAP. Here is how the maven settings file should look like: [settings.xml](./mavenSettings.xml)* 

### Installing

A step by step series of examples that tell you how to get a development env running

* Clone the repository

```
git clone https://github.wdf.sap.corp/plc/hana-xsa.git
```

* Change the current directory to the hana-xsa/publicapi-parent folder

```
cd publicapi/publicapi-parent
```

* Build

```
mvn clean package -P local_build
```

* Setup the environment for local application run 
    - on Windows

    ```
    localEnvironmentSetup.bat
    ```
    - on *nix

    ```
    source ./localEnvironmentSetup.sh
    ```

* Run the application locally 

```
java -jar modules\xsac-plc-publicapi\target\xsac-plc-publicapi.jar
```

* In order to test the application is running, just point your browser to [localhost:8080](http://localhost:8080/). You should be seeing some authentication error message.

## Running the tests

* All tests:

```
mvn clean verify -P all
```

* Just unit tests:

```
mvn clean test
```

* Skip unit tests:

```
mvn clean test -P skipUTs
```

* Just integration tests:

```
mvn clean verify -P integration
```

* Just security tests:

```
mvn clean verify -P security
```

* Just performance tests:

```
mvn clean verify -P performance
```

* Any combined version of tests:

```
mvn clean verify -P performance,security,skipUTs
```
_*run performance and security skipping unit tests*_

Notes: 
* before running the integration tests you need to set the environment up
(see the _*Setup the environment for local application run*_ section above)
* By default, the integration tests run with the H2 embedded database. 
In order to run the integration tests with hana, the spring profile withHanaDB needs to be activated. 
This can be done by creating an env variable called spring.profiles.active, and initializing it with the 
value 'withHanaDB'.
```
export spring.profiles.active=withHanaDB
``` 
for *nix or 
```
SET spring.profiles.active=withHanaDb
```
for Windows

## Tuning up the jdbc connection pooling

PLC public api uses Hikari connection pooling for jdbc. The plc default values for maximum pool size and minimum idle default to 100, and 10, respectively. They can be altered with the environment variables: PLC_DB_MAX_POOL_SIZE and PLC_DB_MIN_IDLE.
More information about what max pool size and min idle represent can be found [here](https://github.com/brettwooldridge/HikariCP#frequently-used).

## Built With

* [Spring](https://spring.io/) - The core framework for the API
* [Swagger](https://swagger.io/) - The API documentation framework
* [Hibernate](http://hibernate.org/) - The persistence framework
* [Apache Commons](https://commons.apache.org/) - The utility framework
* [Jackson](https://github.com/FasterXML/jackson-databind) - The serialization framework
* [Maven](https://maven.apache.org/) - Project Management & Comprehension Tool

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on the development process and the development guidelines.

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.wdf.sap.corp/plc/publicapi/tags). 

## Authors

* **Petrut Petrache** - *Initial work & updates* - [cristian.petrut.petrache@sap.com](mailto:petrut.petrache@sap.com)

See also the list of [contributors](https://github.wdf.sap.corp/plc/publicapi/contributors) who participated in this project.

