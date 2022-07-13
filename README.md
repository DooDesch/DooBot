# DooBot

A simple bot that can create roles with categories and channels on the fly. (`addstack [roleName]` command)

The bot is based on [guidebot](https://github.com/AnIdiotsGuide/guidebot/) and extended with events like `messageReactionAdd`, `messageReactionRemove` and `voiceStateUpdate`.

Features:

-   Create roles with categories and channels
-   Create a message in a channel that keeps track of users in voice channels

This bot has been written for a small Discord Server that consists of a small group of friends.

This bot has some hard coded german texts in it.

Also I've somehow completely coded against the ideas behind the guidebot.
I don't think I'll refactor it any time soon though.

## How to start

```
$ node index.js
```
