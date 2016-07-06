<?php

namespace App\Models;

use DB;
use URL;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Doc;
use App\Traits\AnnotatableHelpers;

class Annotation extends Model implements ActivityInterface
{
    use SoftDeletes;
    use AnnotatableHelpers;

    const ANNOTATION_CONSUMER = "Madison";

    const TYPE_COMMENT = 'Comment';
    const TYPE_FLAG = 'Flag';
    const TYPE_LIKE = 'Like';
    const TYPE_RANGE = 'Range';
    const TYPE_SEEN = 'Seen';
    const TYPE_TAG = 'Tag';

    protected $table = 'annotations';
    protected $fillable = ['data', 'user_id'];
    protected $dates = ['deleted_at'];
    protected $casts = [
        'data' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo('App\Models\User');
    }

    public function permissions()
    {
        return $this->hasMany('App\Models\AnnotationPermission', 'annotation_id');
    }

    public function annotations()
    {
        return $this->morphMany('App\Models\Annotation', 'annotatable');
    }

    public function annotatable()
    {
        return $this->morphTo();
    }

    public function annotationType()
    {
        return $this->morphTo();
    }

    public function delete()
    {
        DB::transaction(function () {
            $this->annotations()->delete();
            AnnotationPermission::where('annotation_id', '=', $this->id)->delete();
            return parent::delete();
        });
    }

    /**
     * Construct link for the Annotation.
     *
     * @return URL|null
     */
    public function getLink()
    {
        switch ($this->annotation_type_type) {
            case AnnotationTypes\Comment::class:
                $root = $this->getRootTarget();

                if ($root instanceof Doc) {
                    $slug = DB::table('docs')->where('id', $root->id)->pluck('slug');

                    $hash = '';
                    if ($this->isNote()) {
                        if ($this->annotatable_type === Annotation::class) {
                            $hash = 'annsubcomment';
                        } else {
                            $hash = 'annotation';
                        }
                    } else {
                        $hash = 'comment';
                    }

                    return URL::to('docs/'.$slug.'#'.$hash.'_'.$this->id);
                }

                return;
            default:
                return;
        }
    }

    /**
     * Create RSS item for the Annotation.
     *
     * @return array
     */
    public function getFeedItem()
    {
        switch ($this->annotation_type_type) {
            case AnnotationTypes\Comment::class:
                $description = $this->annotationType->content;
                break;
            default:
                $description = 'Unknown';
        }

        return [
            'title' => $this->user->display_name."'s Annotation",
            'author' => $this->user->display_name,
            'link' => $this->getLink(),
            'pubdate' => $this->updated_at,
            'description' => $description,
            'content' => '',
            'enclosure' => [],
            'category' => '',
        ];
    }

    /**
     * Get the ultimate non-Annotation target for this Annotation. Currently
     * the only possibility is a Document.
     *
     * @return Doc
     */
    public function getRootTarget()
    {
        if ($this->annotatable_type !== Annotation::class) {
            return $this->annotatable;
        }

        return $this->annotatable->getRootTarget();
    }

    public function isNote()
    {
        if ($this->annotation_type_type != AnnotationTypes\Comment::class) {
            return false;
        }

        return $this->ranges_count > 0;
    }
}