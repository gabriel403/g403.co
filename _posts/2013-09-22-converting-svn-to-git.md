---
layout: post
title: A Howto on Converting SVN repos to Git
tags:
- svn
- git
permalink: /blog/Posts/ConvertSVNToGit.html
---
One of our major projects at GoMAD Tech is currently stored in SVN but is soon moving to git.

It really consists of multiple smaller projects, however they're all stored in a single SVN repository. With SVN's subdirectory access this was never a problem, but when parsed into Git these need to be seperate repositories.

We also need to remove unnecessary branches, we have a standard layout of trunk, branches/development and branches/hotfix branches with trunk becoming the master branch. As well as a whole bunch of tags in the tags directory, these need to become normal git tags.

One of the things we need to remember is to adjust the author names and emails for commit messages. So we need to pull the commit authors out of svn and tweak them.  

    svn log --xml https://svn.gomadtech.com/svn/project/subdir/projectdir | grep -P "^<author" | sort -u | perl -pe 's/<author>(.*?)<\\\/author>/$1 = /' > users.txt
we can then edit this file to make the entries look like this  

    gabriel.baker = Gabriel Baker <gabriel.baker@gomadtech.com>
    shabbir.hassanally = Shabbir Hassanally <shabbir.hassanally@gomadtech.com>

After fixing the authors we can start reading out the svn commits and parsing them into git ones, lucky git has this built in (remember to install git and git svn)

    git-svn clone https://svn.gomadtech.com/svn/project/subdir/projectdir --authors-file=users.txt --no-metadata -s ProjectInGit

So now we have a local repo with history still intact, but we're missing proper gittags and branches.

    gabriel@svn:~/ProjectInGit$ git status
    # On branch master
    nothing to commit (working directory clean)
    gabriel@svn:~/ProjectInGit$ git branch
    * master
    gabriel@svn:~/ProjectInGit$ git tag
    gabriel@svn:~/ProjectInGit$
So we need to parse those out and create first our tags:

    git for-each-ref refs/remotes/tags | cut -d / -f 4- | grep -v @ | while read tagname; do git tag "$tagname" "tags/$tagname"; git branch -r -d "tags/$tagname"; done

And we have:

    Deleted remote branch tags/2.0.0 (was 7dea8c7).
    Deleted remote branch tags/2.1.0 (was 5b7a0cc).
    Deleted remote branch tags/2.1.1 (was a1f7702).
    gabriel@svn:~/ProjectInGit$ git branch
    * master
    gabriel@svn:~/ProjectInGit$ git tag
    2.0.0
    2.1.0
    2.1.1

And then we create our branches:

    git for-each-ref refs/remotes | cut -d / -f 3- | grep -v @ | while read branchname; do git branch "$branchname" "refs/remotes/$branchname"; git branch -r -d "$branchname"; done

    Deleted remote branch development (was 28cd707).
    Deleted remote branch hotfixes (was 81b7b4b).
    Deleted remote branch trunk (was fe2b690).
    gabriel@svn:~/ProjectInGit$ git branch
      development
      hotfixes
    * master
      trunk

No point keeping the trunk branch now we have master

    gabriel@svn:~/ProjectInGit$ git branch -D trunk
    Deleted branch trunk (was fe2b690).
    gabriel@svn:~/ProjectInGit$ git branch
      development
      hotfixes
    * master

Then we can add our new remote and push our branches and tags to it

    git remote add origin git@github.com:GoMADTech/Project.git
    git push origin --all
    git push origin --tags

And now we have you repo, converted from SVN to Git and hosted on Github.
Enjoy!
