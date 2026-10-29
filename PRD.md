# 项目名称：IELTS 听说全能训练平台 (免 API Key · Gemini 协同与本地题库版)

## 1. 核心工作流与技术栈要求
- 核心模式：**纯前端零 API Key 架构**。不在网页端直接调用付费大模型 API，所有听力题目解析、考点句、7.5分词汇、全英文思维导图以及口语题库，均由教师在外部 Gemini 账号中分析生成后，通过【网页端 Gemini 结果导入台】或【VS Code Agent Skill】写入网站数据。
- 前端框架：React (Vite) + Tailwind CSS + Lucide React (图标)
- 数据存储：
  - `public/audio/`：存放听力与口语示范音频（如 `cam18-t1-s1.mp3`）
  - `src/data/tests/`：存放各套听力真题 JSON 文件
  - `src/data/speaking/`：存放口语练习题目、范文、英文思维导图与口语话题词 JSON 文件
  - `src/data/index.js`：统一注册并汇总所有听力与口语数据，自动按话题大类聚合全站【话题分类总词库】
  - `localStorage`：保存学生的做题记录、错题本、生词本以及教师通过网页端导入的新增听力/口语套题
- 教师可从教研导入台切换听力/口语材料，口语课程支持 JSON 导入、手动录入、编辑与删除；口语词汇随课程数据自动参与全站话题词库聚合。
- 本地开发服务器提供文件保存/删除接口：听力/口语 JSON 分别写入 `src/data/tests/` 与 `src/data/speaking/`；音频管理仅针对 `public/audio/` 中的单个受支持音频文件。
- 听力套题可选 `mapImageUrl` 指向 `public/images/` 中的 PNG、JPG 或 WebP 地图/示意图；此字段缺省时不显示地图图片。
- 听力套题的 `transcript` 使用由教师原文解析出的 `startTime` / `endTime`；原始粘贴内容可保存在 `rawTranscript`。Gemini 导入提示词不要求模型生成任何时间戳，题目原句与精听句的时间由网站根据听力原文自动匹配，并写入最终保存的套题数据。
- 原文时间戳支持 `[00:08 - 00:15] Speaker: Text`、`[00:08] Text`、`00:08 - 00:15 Text` 和 `0:08 Text`。仅有起始时间时，使用下一行的起始时间作为结束时间；最后一行默认延后 8 秒。
- 删除听力套题时可选择保留或同时删除其关联音频；删除音频文件会影响仍引用该文件的其他课程。

## 2. 单套听力真题标准 JSON 结构 (`src/data/tests/*.json`)
{
  "id": "cam18-t1-s1",
  "title": "Cambridge 18 Test 1 Section 1: Transport Survey",
  "part": "Part 1",
  "topicCategory": "日常服务与市政交通",
  "audioUrl": "/audio/cam18-t1-s1.mp3",
  "mapImageUrl": "/images/cam18-t1-s1-map.webp",
  "rawTranscript": "[00:08 - 00:15] Interviewer: Excuse me, would you mind if I asked you some questions about your journey today?",
  "transcript": [
    {
      "id": "seg-1",
      "startTime": 12.5,
      "endTime": 18.2,
      "speaker": "Interviewer",
      "text": "Excuse me, would you mind if I asked you some questions about your journey today?"
    }

    Gemini 侧的分析 JSON 只需提供 `questions`、`keySentences`、`vocabulary` 和 `mindMap` 四个字段。题目提供 `sentence`（匹配题在每个 `items` 提供 `sentence`），精听句提供 `english`；不要提供 `startTime`、`endTime` 或 `audioRef`。导入台通过归一化文本及相邻两段原文匹配，自动补全存储数据中的时间引用。
  ],
  "questions": [
    {
      "id": "q1",
      "type": "fill_blank",
      "prompt": "Postcode: ________",
      "correctAnswer": ["DW30 7YZ", "dw30 7yz"],
      "explanation": "女士在被问及邮编时明确拼读出 DW30 7YZ，注意数字与字母连读。",
      "audioRef": {
        "startTime": 45.0,
        "endTime": 52.5,
        "sentence": "It's DW30 7YZ."
      }
    },
    {
      "id": "q2",
      "type": "single_choice",
      "prompt": "Why did Sadie choose to travel by bus today?",
      "options": [
        { "label": "A", "text": "Her car is being repaired" },
        { "label": "B", "text": "Parking in the city centre is expensive" },
        { "label": "C", "text": "The bus stop is right outside her house" }
      ],
      "correctAnswer": "A",
      "explanation": "原文提到她的车送去修了（at the garage），所以今天改坐公交。",
      "audioRef": {
        "startTime": 68.0,
        "endTime": 75.5,
        "sentence": "I normally drive, but my car is at the garage today."
      }
    },
    {
      "id": "q3",
      "type": "multiple_choice",
      "prompt": "Which TWO complaints does Sadie make about the bus service?",
      "options": [
        { "label": "A", "text": "The fare is too high" },
        { "label": "B", "text": "The evening buses are infrequent" },
        { "label": "C", "text": "The buses are often dirty" },
        { "label": "D", "text": "The route takes too long" },
        { "label": "E", "text": "There are not enough seats in the morning" }
      ],
      "correctAnswer": ["B", "E"],
      "explanation": "她在后半段指出晚上班次太少（hardly any buses after 8 pm）以及早高峰没座位。",
      "audioRef": {
        "startTime": 110.0,
        "endTime": 128.0,
        "sentence": "In the evening there are hardly any buses after 8 pm, and in the morning you always have to stand."
      }
    },
    {
      "id": "q4",
      "type": "matching",
      "prompt": "Match each city facility with the speaker's comment:",
      "options": [
        { "label": "A", "text": "Recently renovated" },
        { "label": "B", "text": "Needs better signposting" },
        { "label": "C", "text": "Closed on weekends" }
      ],
      "items": [
        { "itemId": "m1", "itemText": "Central Library", "correctAnswer": "A", "startTime": 140.0, "endTime": 148.0, "sentence": "The Central Library has just been completely refurbished.", "explanation": "refurbished 对应 renovated（翻新）。" }
      ]
    }
  ],
  "keySentences": [
    {
      "id": "ks-1",
      "startTime": 68.0,
      "endTime": 75.5,
      "english": "I normally drive, but my car is at the garage today.",
      "chinese": "我平时开车，但今天我的车送去汽修厂了。",
      "examPoint": "转折逻辑考点：normally 引导的通常是干扰项，but 之后才是正确答案。"
    }
  ],
  "vocabulary": [
    {
      "id": "v-1",
      "term": "customer retention",
      "pos": "n. phr.",
      "chinese": "客户留存；留住顾客",
      "topicCategory": "经营理念与服务类",
      "exampleSentence": "Good after-sales service is crucial for customer retention.",
      "sourceTestId": "cam18-t1-s1"
    }
  ],
  "mindMap": {
    "label": "Transport Survey (City Bus Service)",
    "children": [
      {
        "label": "Passenger Profile",
        "children": [
          { "label": "Travelling to city centre for dentist appointment" },
          { "label": "Postcode: DW30 7YZ" }
        ]
      },
      {
        "label": "Bus Service Feedback",
        "children": [
          { "label": "Reason for taking bus: car at the garage" },
          { "label": "Complaints: infrequent evening service & crowded morning buses" }
        ]
      }
    ]
  }
}

## 3. 单篇口语练习标准 JSON 结构 (`src/data/speaking/*.json`)
{
  "id": "spk-1",
  "title": "Customer Service",
  "part": "Part 2 & 3",
  "topicCategory": "经营理念与服务类",
  "questionPrompt": "Describe a time when you received excellent customer service from a company or public transport.",
  "cueCardPoints": [
    "What the service was",
    "When and where you received it",
    "Who provided the service",
    "And explain why you think it was excellent customer service"
  ],
  "audioUrl": "/audio/spk-1.mp3",
  "sampleAnswer": "I'd like to talk about an impressive experience I had with our city's renovated public transport customer service...",
  "vocabulary": [
    {
      "id": "sv-1",
      "term": "go the extra mile",
      "pos": "idiom",
      "chinese": "加倍努力；提供超预期的服务",
      "topicCategory": "经营理念与服务类",
      "exampleSentence": "The staff really went the extra mile to help passengers during rush hour.",
      "sourceTestId": "spk-1"
    }
  ],
  "mindMap": {
    "label": "Excellent Public Transport Service",
    "children": [
      {
        "label": "Background & Context",
        "children": [
          { "label": "Car was at the garage for repair" },
          { "label": "Took the newly refurbished city bus" }
        ]
      },
      {
        "label": "Why It Was Impressive",
        "children": [
          { "label": "Staff went the extra mile to guide commuters" },
          { "label": "Real-time digital signposting reduced waiting anxiety" }
        ]
      }
    ]
  }
}

`title` 是页面三级课程选择器使用的可编辑具体题目名称；缺省时使用 `questionPrompt`。Part 1 课程可使用 `questions: [{ "question": "...", "sampleAnswer": "..." }]` 存放多个独立问答，`questionPrompt` 存放话题名称。Part 2/3 继续使用 `cueCardPoints` 与 `sampleAnswer`。相似课程手动合并后可额外使用 `sets` 数组；每项需含 `id`、`label`、`part`、`topicCategory`、`questionPrompt`、`questions`、`cueCardPoints`、`sampleAnswer`、`vocabulary`、`mindMap` 与 `audioUrl`，词汇的 `sourceTestId` 统一为所属课程 ID。

Listening 的 `part` 建议明确保存为 `Part 1` 至 `Part 4`；旧数据缺省时由标题中的 Part/Section 推断，仍无法识别时归入 Part 1。