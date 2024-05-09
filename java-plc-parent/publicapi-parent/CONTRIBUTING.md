# Contributing

When contributing to this repository, please first make sure there is a Jira item you are assigned to. 
Please note we have a development process and some development guidelines. 
Please follow them in all your interactions with the project.

## The [git flow](https://nvie.com/posts/a-successful-git-branching-model/) development process

Each developer needs to have a open jira ticket. 
The development starts by creating a new branch from the *development* branch. 
The new branch needs to be named feature/PLC1-_*XXXX*_, according to the ticket id in jira.
Also the commits need to have a commit message that starts with the ticket id in jira 
(we need this because later when the branch is merged back to *development*, we ned to know what was 
the ticket that was implemented by the commit).

* Checkout the *dev* branch
```
git checkout dev
```

* Make sure you have the latest version of the branch
```
git pull --rebase
```

* Create the feature branch
```
git checkout -b feature/PLC1-1234
```

* Implement the feature and make sure that all unit tests pass
```
mvn clean verify
```

* Try to run the application and make sure it starts. 
It is advisable to do some smoke tests, like trying to call some trivial 
services.

* Stage the files for commit
```
git add your_files
```

* Commit the change, specifying the Jira ticket id and a short description
```
git commit -m "PLC1-1234: implemented the feature 1234"
```

* Fetch the latest development version and rebase it (fix the conflicts, if any)
```
git fetch --prune
git rebase development
```

* Push the change
```
git push --set-upstream origin feature/PLC1-1234
```

* [Create the pull request in github](https://github.wdf.sap.corp/plc/publicapi/compare) web interface

* Answer the comments, if any, and then merge your code. If you need more commits to implement the change, 
please squash them in a single commit. Make sure that all tests pass. 
Create a new pull request after the code is fixed.
```
git rebase -i HEAD~theNoOfCommitsToSquash
```

## Unit/ integration/ security/ performance testing

* All tests reside in the test folder.
* **Unit tests are mandatory for all new business logic**. 
The unit tests will be in the same package as the class that is tested,
and the name will be the test class suffixed with UnitTest. 
All unit tests extend from _*com.sap.plc.backend.AbstractTest*_, 
except for the Controller unit tests, that extend from _*com.sap.plc.backend.AbstractControllerTest*_.
* Integration/ security/ performance tests are optional.
They extend from _*com.sap.plc.backend.AbstractIntegrationTest*_.
The integration/ security/ performance tests will be in the same package as the class that is tested,
and the name will be the test class suffixed with IntegrationTest/ SecurityTest/ PerformanceTest.

## The review guidelines
* Make sure that you have enough test coverage. 
Automatic check of the code coverage delta will be added in the future. Any limit exceeding will 
prevent the pull request. 
* Update the README.md with details of changes, as needed.
* For the comments and responses please:
    * Use a welcoming and inclusive language
    * Be respectful of differing viewpoints and experiences
    * Gracefully accept constructive criticism
    * Focus on what is best for the project
    * Show empathy towards the other team members

## Coding guidelines

In order to prevent formatting issues with commits from different environments, and to make the code 
easier to maintain and understand, please follow the 
[Google Java Style Guide](https://google.github.io/styleguide/javaguide.html).

## Attribution

Parts of this document have been adapted from:

* [Contributor Covenant](http://contributor-covenant.org), version 1.4,
available at [http://contributor-covenant.org/version/1/4](http://contributor-covenant.org/version/1/4/)

* [Google Java Style Guide](http://contributor-covenant.org/version/1/4/) 
