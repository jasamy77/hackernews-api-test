import { test, expect, request } from '@playwright/test'

const HACKER_BASE_URL = 'https://hacker-news.firebaseio.com/v0'
const TOP_STORIES_URL = `${HACKER_BASE_URL}/topstories.json`
const ITEM_URL = id => `${HACKER_BASE_URL}/item/${id}.json`

test.describe('########  Hacker News API Tests #######', () => {
    let api;

    test.beforeAll(async () => {
        api = await request.newContext();
    });

    test.afterAll(async () => {
        await api.dispose();
    });

    test('1. Retrieve top stories', async () => {
        const response = await api.get(TOP_STORIES_URL);
        expect(response.ok()).toBeTruthy();

        const storyIds = await response.json();
        const top5Ids = storyIds.slice(0, 1);

        // Step 2: Fetch each top story item and print
        for (const id of top5Ids) {
            const storyResp = await api.get(ITEM_URL(id));
            const story = await storyResp.json();

            console.log(`----- Top Story from Top story API ----`);
            console.log(` Title: ${story.title}`);
            console.log(` Author: ${story.by}`);
            console.log(` Score: ${story.score}`);
            console.log(` URL: ${story.url || 'No URL available'}`);
            console.log(`---------------------`);
        }

    });

    test('2. Retrieve current top story from Items API', async () => {

        const api = await request.newContext();

        // Step 1: Get list of top story IDs
        const topStoriesResponse = await api.get(TOP_STORIES_URL);
        const storyIds = await topStoriesResponse.json();

        // Step 2: Take the first (topmost) story ID
        const topStoryId = storyIds[0];

        // Step 3: Get full story details from item API
        const storyResponse = await api.get(ITEM_URL(topStoryId));
        const story = await storyResponse.json();

        // Step 4: Print story details
        console.log(`----- Retrieve current top story from Items API  ----`);
        console.log(`ID: ${story.id}`);
        console.log(`Title: ${story.title}`);
        console.log(`By: ${story.by}`);
        console.log(`Score: ${story.score}`);
        console.log(`URL: ${story.url || 'No URL available'}`);
        console.log(`---------------------`);


    });

    test('3. Retrieve top story and its first comment', async () => {

        // Step 1: Get top story IDs
        const topStoriesRes = await api.get(TOP_STORIES_URL);
        const topIds = await topStoriesRes.json();
        const topStoryId = topIds[0];

        // Step 2: Fetch top story details
        const storyRes = await api.get(ITEM_URL(topStoryId));
        const story = await storyRes.json();

        console.log(` API to retrieve a top story, retrieve its first comment `);
        console.log(`Title: ${story.title}`);
        console.log(`By: ${story.by}`);
        console.log(`Score: ${story.score}`);
        console.log(`URL: ${story.url || 'No URL'}`);

        // Step 3: Check if it has comments
        if (story.kids && story.kids.length > 0) {
            const firstCommentId = story.kids[0];

            // Step 4: Fetch first comment
            const commentRes = await api.get(ITEM_URL(firstCommentId));
            const comment = await commentRes.json();

            console.log(`\n First Comment`);
            console.log(`By: ${comment.by}`);
            console.log(`Text: ${comment.text}`);
        } else {
            console.log('\n No comments available for this story.');
        }


    });

    test('4. Edge case', async () => {
        const invalidId = -1;
        const response = await api.get(ITEM_URL(invalidId));
        console.log(` API returns : missing or deleted item `);

        expect(response.status()).toBe(200); // API returns 200 with `null` JSON for missing
        const body = await response.json();
        expect(body).toBe(null);
    });

    test('4. Edge case: Top story without comments', async () => {
        const topStories = await (await api.get(TOP_STORIES_URL)).json();
        console.log(` API returns : Top story without comments `);
        // Find a story with no comments
        for (let id of topStories) {
            const story = await (await api.get(ITEM_URL(id))).json();
            if (!story.kids || story.kids.length === 0) {
                expect(story.kids || []).toEqual([]);
                return;
            }
        }

    });
});