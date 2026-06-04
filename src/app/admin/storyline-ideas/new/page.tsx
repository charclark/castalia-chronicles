import EntryEditor from "@/components/EntryEditor";
import { createStorylineIdea } from "@/app/actions/storyline-ideas";

export default function NewStorylineIdeaPage() {
  return (
    <EntryEditor
      backHref="/admin"
      saveAction={createStorylineIdea}
      typeName="Idea"
    />
  );
}
