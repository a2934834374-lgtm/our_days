-- ============================================
-- RLS 安全修复：确保只有配对双方能互看数据
-- 在 Supabase SQL Editor 中执行
-- ============================================

-- 1. 创建辅助函数：判断两个用户是否为配对关系
CREATE OR REPLACE FUNCTION public.is_partner(uid UUID, other_uid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_relations
    WHERE (user_a = uid AND user_b = other_uid)
       OR (user_a = other_uid AND user_b = uid)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 删除旧的太宽松的策略 ============

-- profiles
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

-- moods
DROP POLICY IF EXISTS "moods_select" ON public.moods;
DROP POLICY IF EXISTS "moods_insert" ON public.moods;

-- savings_goals
DROP POLICY IF EXISTS "savings_goals_select" ON public.savings_goals;
DROP POLICY IF EXISTS "savings_goals_insert" ON public.savings_goals;
DROP POLICY IF EXISTS "savings_goals_update" ON public.savings_goals;

-- savings_contributions
DROP POLICY IF EXISTS "savings_contributions_select" ON public.savings_contributions;
DROP POLICY IF EXISTS "savings_contributions_insert" ON public.savings_contributions;

-- plant_waterings
DROP POLICY IF EXISTS "plant_waterings_select" ON public.plant_waterings;
DROP POLICY IF EXISTS "plant_waterings_insert" ON public.plant_waterings;

-- moments
DROP POLICY IF EXISTS "moments_select" ON public.moments;
DROP POLICY IF EXISTS "moments_insert" ON public.moments;

-- moment_likes
DROP POLICY IF EXISTS "moment_likes_select" ON public.moment_likes;
DROP POLICY IF EXISTS "moment_likes_insert" ON public.moment_likes;
DROP POLICY IF EXISTS "moment_likes_delete" ON public.moment_likes;

-- moment_comments
DROP POLICY IF EXISTS "moment_comments_select" ON public.moment_comments;
DROP POLICY IF EXISTS "moment_comments_insert" ON public.moment_comments;

-- 3. 重建安全的策略 ============

-- profiles: 双方可互看，只能改自己的
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT
  USING (auth.uid() = user_id OR public.is_partner(auth.uid(), user_id));
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- moods: 只有配对双方可见，只能创建自己的
CREATE POLICY "moods_select" ON public.moods FOR SELECT
  USING (auth.uid() = user_id OR public.is_partner(auth.uid(), user_id));
CREATE POLICY "moods_insert" ON public.moods FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- savings_goals: 配对双方可见，可共同编辑
CREATE POLICY "savings_goals_select" ON public.savings_goals FOR SELECT
  USING (auth.uid() = created_by OR public.is_partner(auth.uid(), created_by));
CREATE POLICY "savings_goals_insert" ON public.savings_goals FOR INSERT
  WITH CHECK (auth.uid() = created_by);
CREATE POLICY "savings_goals_update" ON public.savings_goals FOR UPDATE
  USING (auth.uid() = created_by OR public.is_partner(auth.uid(), created_by));

-- savings_contributions: 配对双方可见，只能创建自己的
CREATE POLICY "savings_contributions_select" ON public.savings_contributions FOR SELECT
  USING (auth.uid() = user_id OR public.is_partner(auth.uid(), user_id));
CREATE POLICY "savings_contributions_insert" ON public.savings_contributions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- plant_waterings: 配对双方可见，只能创建自己的
CREATE POLICY "plant_waterings_select" ON public.plant_waterings FOR SELECT
  USING (auth.uid() = user_id OR public.is_partner(auth.uid(), user_id));
CREATE POLICY "plant_waterings_insert" ON public.plant_waterings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- moments: 配对双方可见，只能创建自己的
CREATE POLICY "moments_select" ON public.moments FOR SELECT
  USING (auth.uid() = user_id OR public.is_partner(auth.uid(), user_id));
CREATE POLICY "moments_insert" ON public.moments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- moment_likes: 配对双方可见，只能操作自己的
CREATE POLICY "moment_likes_select" ON public.moment_likes FOR SELECT
  USING (auth.uid() = user_id OR public.is_partner(auth.uid(), user_id));
CREATE POLICY "moment_likes_insert" ON public.moment_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "moment_likes_delete" ON public.moment_likes FOR DELETE
  USING (auth.uid() = user_id);

-- moment_comments: 配对双方可见，只能创建自己的
CREATE POLICY "moment_comments_select" ON public.moment_comments FOR SELECT
  USING (auth.uid() = user_id OR public.is_partner(auth.uid(), user_id));
CREATE POLICY "moment_comments_insert" ON public.moment_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);
