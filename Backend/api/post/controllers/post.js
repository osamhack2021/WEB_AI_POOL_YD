'use strict';

const { sanitizeEntity } = require('strapi-utils');

module.exports = {
    async full(ctx) {
        const _posts = await strapi.query("post").find();
        const results = await Promise.all(_posts.map(async el => {
            let commentIds = el.comments.map(_co => { return _co._id });
            let comments = await strapi.query("comment").find({id_in: commentIds});
            return {
                id: el.id,
                createdAt: el.createdAt,
                updatedAt: el.updatedAt,
                author: {
                    id: el.author.id,
                    username: el.author.username,
                    profileImageUrl: el.author.thumbnail.url,
                },
                title: el.title,
                contentPreview: el.content ? el.content : null,
                previewMainImageUrl: el.images.length>0 ? el.images[0].url : null,
                commentsCount: el.comments.length,
                likesCount: el.likes.length,
                comments: comments.map(_co => {
                    return {
                        id: _co.id,
                        createdAt: _co.createdAt,
                        updatedAt: _co.updatedAt,
                        author: {
                            id: _co.author.id,
                            username: _co.author.username,
                            profileImageUrl: _co.author.thumbnail.url,
                        },
                        content: _co.comment
                    }
                }),
                likes: el.likes.map(_user => { return {
                    id: _user.id,
                    username: _user.username,
                    profileImageUrl: _user.thumbnail.url
                }})
            };
        }));
        return { data : results };
    },
    async preview(ctx) {
        const _posts = await strapi.query("post").find();
        const _preview = _posts.map(el => { 
            return {
                id: el.id,
                createdAt: el.createdAt,
                author: {
                    id: el.author.id,
                    username: el.author.username,
                    profileImageUrl: el.author.thumbnail.url,
                },
                title: el.title,
                contentPreview: el.content ? el.content : null,
                previewMainImageUrl: el.images.length>0 ? el.images[0].url : null,
                commentsCount: el.comments.length,
                likesCount: el.likes.length,
            };
        });
        return { data : _preview };
    },
    async discover(ctx) {
        const { body } = ctx.request;
        const { target, tags, number } = body;
        let filter1 = [];
        let filter2 = [];
        let filter3 = [];
        let users;
        let posts;
        switch(target) {
            case 'user':
                tags.forEach(tag => {
                    if (tag.subject === "계급") filter1.push(tag.tag);
                    else if (tag.subject === "병과") filter2.push(tag.tag);
                    else filter3.push(tag.tag);
                });
                users = await strapi.query("user", "users-permissions").find();
                users = users.filter(user => {
                    if(user.soldierData) {
                        let e = false;
                        user.tags.forEach(tag => {
                            if (filter3.indexOf(tag.content) > -1) {
                                e = true;
                            };
                        });
                        return filter1.indexOf(user.soldierData.rank) > -1
                        && filter2.indexOf(user.soldierData.militaryBranch) > -1
                        && e;
                    }
                    return false;
                });
                console.log(users);
                break;
            case 'pool':
                break;
            case 'recruition':
                tags.forEach(tag => {
                    if (tag.subject === "계급 조건") filter1.push(tag.tag);
                    else if (tag.subject === "관련 병과") filter2.push(tag.tag);
                    else filter3.push(tag.tag);
                });
                posts = await strapi.query("post").find();
                posts = posts.filter(post => post.postType === "recruition");
                filter1 = filter1.map(el => {
                    switch(el){
                        case "계급 무관": 
                            return "private";
                        case "하사 이상":
                            return "sergeant";
                        case "소위 이상":
                            return "lieutenant";
                        case "소령 이상":
                            return "major";
                        case "준장 이상":
                            return "general";
                    }
                });
                posts = await Promise.all(posts.filter(async post => {
                    let e = false;
                    let relatedBranches = await strapi.query("tag").find({id_in: post.jobInfo.relatedBranches});
                    relatedBranches.forEach(tag => {
                        if (filter2.indexOf(tag.content) > -1) {
                            e = true;
                        }
                    });
                    let group = await strapi.query("tag").find({id: post.jobInfo.group});
                    return filter1.indexOf(post.jobInfo.minRank) > -1
                        && e ;
                        //&& filter3.indexOf(group.content) > -1;    
                }));
                console.log(posts);
                break; 
        }
        const result = {
            data: [
                filter1, filter2, filter3
            ]
        }
        return 'hi';
    },
    async test(ctx) {
        let posts = await strapi.query("post").model.find().in("postType", ["general"]);
        console.log(posts);
        return 'hi';
    }
};