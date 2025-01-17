<template>
  <v-card hover ripple :to="{ path: `/post/${itemData.postInfo.id}` }" style="overflow: hidden">
    <v-layout v-if="itemData.postInfo.postType === 'recruition'"
              justify-center
              align-center
              class="recruition-bar primary white--text">
      <span>＊ 채용 / 모집 공고 ＊</span>
    </v-layout>

    <!-- 타이틀 영역 -->
    <!-- 메인 이미지가 있는 경우 -->
    <v-img v-if="postHasMainImage"
          :src="absolutePath(itemData.postInfo.previewMainImageUrl)"
          dark
          aspect-ratio="2.5"
          class="pa-3 align-end">
      <div class="feed-image-darken-overlay"></div>

      <!-- 이미지 내 프로필 영역 -->
      <v-layout class="mt-0 ml-0" row align-center style="flex-wrap: nowrap">
        <img :src="absolutePath(itemData.postInfo.author.profileImageUrl)"
              aspect-ratio="1"
              class="elevation-2"
              style="width: 64px; border-radius: 100%;" />

        <v-layout column justify-start>
          <v-card-title>{{ itemData.postInfo.title }}</v-card-title>
          <v-card-subtitle>By {{ itemData.postInfo.author.username }}</v-card-subtitle>
        </v-layout>
      </v-layout>
      <!-- -->
    </v-img>
    <!-- -->

    <!-- 메인 이미지가 없는 경우 -->
    <!-- 이미지 외 프로필 영역 -->
    <v-layout v-else class="mt-0 ml-3" row align-center style="flex-wrap: nowrap">
      <img :src="absolutePath(itemData.postInfo.author.profileImageUrl)"
            class="elevation-2"
            style="width: 64px; border-radius: 100%;" />

      <v-layout column justify-start>
        <v-card-title>{{ itemData.postInfo.title }}</v-card-title>
        <v-card-subtitle>By {{ itemData.postInfo.author.username }}</v-card-subtitle>
      </v-layout>
    </v-layout>
    <!-- -->
    <!-- -->

    <!-- 콘텐츠(텍스트) 영역 -->
    <v-card-text v-if="itemData.postInfo.postType !== 'recruition'" class="feed-item-content" v-html="itemData.postInfo.contentPreview"></v-card-text>
    <v-card-text v-else class="feed-item-content" >
      <div>직무 소개 | {{ itemData.postInfo.jobInfo.desc }}</div>
      <div>지원 마감 | {{ itemData.postInfo.jobInfo.due }}</div>
      <div>고용 형태 | {{ itemData.postInfo.jobInfo.employmentType }}</div>
      <v-chip-group>
        <v-chip v-for="(tag, idx) in itemData.postInfo.jobInfo.relatedBranches" :key="idx">
          {{ tag }}
        </v-chip>
      </v-chip-group>
    </v-card-text>
    <!-- -->

    <!-- 카드 하단 영역 -->
    <v-card-actions>
      <v-layout class="pa-4" row justify-space-around>
        <comments-button :useRoute="true" :postId="itemData.postInfo.id" :count="itemData.postInfo.commentsCount" />
        <like-button :postId="itemData.postInfo.id" :liked="itemData.likedByAccount" :count="itemData.postInfo.likesCount" @like-status-update="likeStatusUpdated" class="mx-2" />
        <v-spacer />
        <span class="mx-2 text--disabled" @mouseover="isUploadDateHovering = true" @mouseleave="isUploadDateHovering = false"><v-icon>mdi-clock-outline</v-icon> {{ isUploadDateHovering ? itemData.postInfo.createdAt.toLocaleString() : uploadDateAgo }}</span>
      </v-layout>
    </v-card-actions>
    <!-- -->
  </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { format } from "timeago.js";
import { Prop } from "vue-property-decorator";
import CommentsButton from "@/components/post/CommentsButton.vue";
import LikeButton from "@/components/post/LikeButton.vue";
import IFeedItem from "@/interfaces/IFeedItem";
import { absolutePath as backendAbsolutePath } from "@/util/BackendHelper";

@Component({
  components: {
    CommentsButton,
    LikeButton,
  },
})
export default class FeedItem extends Vue {
  absolutePath = backendAbsolutePath;

  @Prop({ required: true }) itemData!: IFeedItem;
  isUploadDateHovering = false;
  recomputeIntervalId = -1;
  recomputeHack = false;

  created(): void {
    this.itemData.postInfo.author.profileImageUrl = backendAbsolutePath(this.itemData.postInfo.author.profileImageUrl);
    if (this.itemData.postInfo.previewMainImageUrl) {
      this.itemData.postInfo.previewMainImageUrl = backendAbsolutePath(this.itemData.postInfo.previewMainImageUrl);
    }
  }

  mounted(): void {
    if (this.recomputeIntervalId === -1) {
      this.recomputeIntervalId = setInterval(() => {
        this.recomputeHack = !this.recomputeHack;
      }, 60 * 1000);
    }
  }

  beforeDestroy(): void {
    if (this.recomputeIntervalId !== -1) {
      clearInterval(this.recomputeIntervalId);
      this.recomputeIntervalId = -1;
    }
  }

  likeStatusUpdated(value: { likesCount: number, likedByAccount: boolean }): void {
    this.itemData.postInfo.likesCount = value.likesCount;
    this.itemData.likedByAccount = value.likedByAccount;
  }

  get postHasMainImage(): boolean {
    if (this.itemData.postInfo.previewMainImageUrl) {
      return true;
    }
    return false;
  }

  get uploadDateAgo(): string {
    // computed 속성을 강제로 업데이트하기 위한 편법입니다.
    //   1분마다 업데이트(mounted 함수 참조)되는 변수를 참조하는 것만으로
    //   computed 캐싱을 무시하고 재처리합니다.
    // eslint-disable-next-line no-unused-expressions
    this.recomputeHack;

    return format(this.itemData.postInfo.createdAt, "ko");
  }
}
</script>

<style lang="scss" scoped>
.v-card__title,
.v-card__subtitle {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recruition-bar {
  height: 32px;
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 2px;
}

.feed-image-darken-overlay {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background: rgba(0, 0, 0, 0.33);
  z-index: -1;
}

.feed-item-content {
  max-height: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
}
</style>
